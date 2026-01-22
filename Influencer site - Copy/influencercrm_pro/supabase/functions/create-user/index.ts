// supabase/functions/admin-users/index.ts
/// <reference path="./types.d.ts" />

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify the token and get user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user has admin role
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('roleId, userRoles:roleId(roleName)')
      .eq('id', user.id)
      .single()

    if (userError) throw userError

    const isAdmin = ['super_admin', 'admin'].includes(userData?.userRoles?.roleName)
    if (!isAdmin) {
      throw new Error('Insufficient permissions')
    }

    // Handle different methods
    switch (req.method) {
      case 'GET': {
        const { data: users, error } = await supabaseClient
          .from('users')
          .select(`
            *,
            userRoles:roleId (
              roleName,
              displayName
            )
          `)
          .order('createdAt', { ascending: false })

        if (error) throw error

        return new Response(
          JSON.stringify({ data: users }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      case 'POST': {
        const body = await req.json()
        const { email, password, fullName, roleId, isActive } = body

        // Create auth user
        const { data: authUser, error: createError } = await supabaseClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        })

        if (createError) throw createError

        // If user record doesn't exist yet (trigger didn't fire), create it manually
        const { data: userData, error: userError } = await supabaseClient
          .from('users')
          .select('id')
          .eq('id', authUser.user.id)
          .single()

        if (!userData) {
          const { data: newUserData, error: insertError } = await supabaseClient
            .from('users')
            .insert({
              id: authUser.user.id,
              email,
              fullName,
              roleId,
              isActive: isActive ?? true,
              createdAt: new Date().toISOString(),
            })
            .select(`
              *,
              userRoles:roleId (
                roleName,
                displayName
              )
            `)
            .single()

          if (insertError) {
            console.error('Error creating user record:', insertError)
            return new Response(
              JSON.stringify({ error: 'User created in auth but failed to create user record: ' + insertError.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          return new Response(
            JSON.stringify({ data: newUserData }),
            { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Create user profile
        const { data: profile, error: profileError } = await supabaseClient
          .from('users')
          .update({
            email,
            fullName,
            roleId,
            isActive: isActive ?? true,
          })
          .eq('id', authUser.user.id)
          .select(`
            *,
            userRoles:roleId (
              roleName,
              displayName
            )
          `)
          .single()

        if (profileError) {
          // Rollback: delete auth user if profile creation fails
          await supabaseClient.auth.admin.deleteUser(authUser.user.id)
          throw profileError
        }

        return new Response(
          JSON.stringify({ data: profile }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 201,
          }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 405,
          }
        )
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      }
    )
  }
})