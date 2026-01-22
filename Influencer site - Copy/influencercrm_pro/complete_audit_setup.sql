-- =====================================================
-- Complete Audit Setup for State Management
-- =====================================================
-- 1. Create audit_logs table (if not exists)
-- 2. Create bulk_update_state_names_with_audit function
-- 3. Grant necessary permissions
-- =====================================================

-- Step 1: Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action_type VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id TEXT,
    old_value TEXT,
    new_value TEXT,
    changed_by UUID REFERENCES auth.users(id),
    user_email TEXT,
    session_id TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON public.audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by ON public.audit_logs(changed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session_id ON public.audit_logs(session_id);

-- Step 2: Create or replace the bulk update function
CREATE OR REPLACE FUNCTION public.bulk_update_state_names_with_audit(
    mappings JSONB,
    p_changed_by UUID,
    p_user_email TEXT,
    p_session_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    mapping_record JSONB;
    uncleaned_state TEXT;
    standard_state TEXT;
    confidence INTEGER;
    auto_selected BOOLEAN;
    updated_count INTEGER;
    total_updated INTEGER := 0;
    transaction_id TEXT;
    audit_record JSONB;
    result JSONB := '{}';
    results JSONB := '[]';
BEGIN
    -- Generate unique transaction ID for this batch operation
    transaction_id := 'txn_' || EXTRACT(EPOCH FROM NOW())::TEXT || '_' || COALESCE(p_changed_by::TEXT, 'unknown');
    
    -- Initialize result structure
    result := jsonb_build_object(
        'success', true,
        'transaction_id', transaction_id,
        'total_updated', 0,
        'audit_id', transaction_id,
        'results', results
    );
    
    -- Process each mapping
    FOR mapping_record IN SELECT * FROM jsonb_array_elements(mappings)
    LOOP
        -- Extract mapping data
        uncleaned_state := mapping_record->>'uncleanedState';
        standard_state := mapping_record->>'standardState';
        confidence := COALESCE((mapping_record->>'confidence')::INTEGER, 0);
        auto_selected := COALESCE((mapping_record->>'autoSelected')::BOOLEAN, false);
        
        -- Skip if essential data is missing
        IF uncleaned_state IS NULL OR standard_state IS NULL THEN
            CONTINUE;
        END IF;
        
        -- Perform the update
        UPDATE public.creators 
        SET 
            state = standard_state,
            updated_at = NOW()
        WHERE state = uncleaned_state;
        
        -- Get count of updated records
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        total_updated := total_updated + updated_count;
        
        -- Create audit log entry
        INSERT INTO public.audit_logs (
            action_type,
            table_name,
            record_id,
            old_value,
            new_value,
            changed_by,
            user_email,
            session_id,
            metadata,
            created_at
        ) VALUES (
            'STATE_MAPPING_UPDATE',
            'creators',
            uncleaned_state,
            uncleaned_state,
            standard_state,
            p_changed_by,
            p_user_email,
            p_session_id,
            jsonb_build_object(
                'confidence', confidence,
                'auto_selected', auto_selected,
                'transaction_id', transaction_id,
                'updated_count', updated_count
            ),
            NOW()
        );
        
        -- Add to results array
        results := results || jsonb_build_object(
            'uncleaned_state', uncleaned_state,
            'standard_state', standard_state,
            'updated_count', updated_count,
            'confidence', confidence,
            'auto_selected', auto_selected,
            'status', 'success'
        );
    END LOOP;
    
    -- Update final result
    result := jsonb_set(result, '{total_updated}', to_jsonb(total_updated));
    result := jsonb_set(result, '{results}', results);
    
    -- Log the batch operation
    INSERT INTO public.audit_logs (
        action_type,
        table_name,
        record_id,
        old_value,
        new_value,
        changed_by,
        user_email,
        session_id,
        metadata,
        created_at
    ) VALUES (
        'BULK_STATE_MAPPING_UPDATE',
        'creators',
        transaction_id,
        jsonb_extract_path_text(mappings, 'uncleanedState'),
        jsonb_extract_path_text(mappings, 'standardState'),
        p_changed_by,
        p_user_email,
        p_session_id,
        jsonb_build_object(
            'transaction_id', transaction_id,
            'total_mappings', jsonb_array_length(mappings),
            'total_updated', total_updated,
            'batch_operation', true
        ),
        NOW()
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error and return error details
        INSERT INTO public.audit_logs (
            action_type,
            table_name,
            record_id,
            old_value,
            new_value,
            changed_by,
            user_email,
            session_id,
            metadata,
            created_at
        ) VALUES (
            'BULK_STATE_MAPPING_ERROR',
            'creators',
            COALESCE(transaction_id, 'unknown'),
            NULL,
            NULL,
            p_changed_by,
            p_user_email,
            p_session_id,
            jsonb_build_object(
                'error_message', SQLERRM,
                'error_code', SQLSTATE,
                'transaction_id', COALESCE(transaction_id, 'failed'),
                'mappings_data', mappings
            ),
            NOW()
        );
        
        -- Return error response
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'error_code', SQLSTATE,
            'transaction_id', COALESCE(transaction_id, 'failed')
        );
END;
$$;

-- Step 3: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.bulk_update_state_names_with_audit(
    JSONB, UUID, TEXT, TEXT
) TO authenticated, anon, service_role;

GRANT SELECT, INSERT, UPDATE ON public.audit_logs TO authenticated, service_role;

-- Step 4: Enable RLS (Row Level Security) for audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for audit_logs
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
    FOR SELECT USING (
        auth.uid() = changed_by OR 
        auth.jwt() ->> 'role' IN ('service_role', 'admin')
    );

CREATE POLICY "Users can insert their own audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (
        auth.uid() = changed_by OR 
        auth.jwt() ->> 'role' IN ('service_role', 'admin')
    );

-- =====================================================
-- Setup Complete!
-- =====================================================
-- You can now test the function with:
-- SELECT public.bulk_update_state_names_with_audit(
--     '[{"uncleanedState": "UP", "standardState": "Uttar Pradesh", "confidence": 95, "autoSelected": true}]'::JSONB,
--     NULL::UUID,
--     'test@example.com',
--     'test_session_123'
-- );
-- =====================================================
