-- =====================================================
-- Simple Bulk Update Function (Without Audit)
-- =====================================================
-- Purpose: Bulk update state names without audit logging
-- Created: Quick fix for state management system
-- =====================================================

-- First drop any existing function to avoid ambiguity
DROP FUNCTION IF EXISTS public.bulk_update_state_names(json);
DROP FUNCTION IF EXISTS public.bulk_update_state_names(jsonb);

CREATE OR REPLACE FUNCTION public.bulk_update_state_names(
    mappings JSONB
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
    result JSONB := '{}';
    results JSONB := '[]';
BEGIN
    -- Generate unique transaction ID for this batch operation
    transaction_id := 'txn_' || EXTRACT(EPOCH FROM NOW())::TEXT;
    
    -- Initialize result structure
    result := jsonb_build_object(
        'success', true,
        'transaction_id', transaction_id,
        'total_updated', 0,
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
        
        -- Perform update directly
        UPDATE public.creators 
        SET 
            state = standard_state,
            updated_at = NOW()
        WHERE state = uncleaned_state;
        
        -- Get count of updated records
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        total_updated := total_updated + updated_count;
        
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
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return error response
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'error_code', SQLSTATE,
            'transaction_id', COALESCE(transaction_id, 'failed')
        );
END;
$$;

-- =====================================================
-- Grant necessary permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION public.bulk_update_state_names(
    JSONB
) TO authenticated, anon, service_role;

-- =====================================================
-- Function validation and testing query
-- =====================================================
-- Test the function with sample data (uncomment to test):
-- SELECT public.bulk_update_state_names(
--     '[{"uncleanedState": "UP", "standardState": "Uttar Pradesh", "confidence": 95, "autoSelected": true}]'::JSONB
-- );

-- =====================================================
-- Migration completed successfully
-- =====================================================
