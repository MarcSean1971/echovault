
-- Function to get complete message details in a single query
CREATE OR REPLACE FUNCTION public.get_message_details(p_message_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT 
    jsonb_build_object(
      'message', jsonb_build_object(
        'id', m.id,
        'user_id', m.user_id,
        'title', m.title,
        'content', m.content,
        'text_content', m.text_content,
        'video_content', m.video_content,
        'message_type', m.message_type,
        'created_at', m.created_at,
        'updated_at', m.updated_at,
        'attachments', COALESCE(m.attachments, '[]'::jsonb),
        'share_location', m.share_location,
        'location_latitude', m.location_latitude,
        'location_longitude', m.location_longitude,
        'location_name', m.location_name
      ),
      'condition', (
        SELECT jsonb_build_object(
          'id', c.id,
          'message_id', c.message_id,
          'condition_type', c.condition_type,
          'active', c.active,
          'hours_threshold', c.hours_threshold,
          'minutes_threshold', c.minutes_threshold,
          'last_checked', c.last_checked,
          'next_check', c.next_check,
          'check_in_code', c.check_in_code,
          'unlock_delay_hours', c.unlock_delay_hours,
          'pin_code', c.pin_code,
          'reminder_hours', c.reminder_hours
        )
        FROM message_conditions c
        WHERE c.message_id = p_message_id
      ),
      'delivery', (
        SELECT jsonb_agg(jsonb_build_object(
          'id', d.id,
          'message_id', d.message_id,
          'recipient_id', d.recipient_id,
          'delivery_id', d.delivery_id,
          'delivered_at', d.delivered_at,
          'viewed_at', d.viewed_at,
          'viewed_count', d.viewed_count
        ))
        FROM delivered_messages d
        WHERE d.message_id = p_message_id
      ),
      'recipients', (
        SELECT jsonb_agg(jsonb_build_object(
          'id', r.id,
          'name', r.name,
          'email', r.email,
          'phone', r.phone
        ))
        FROM message_conditions c
        CROSS JOIN jsonb_array_elements(c.recipients) AS rcpt(content)
        INNER JOIN recipients r ON r.id = (rcpt.content->>'id')::uuid
        WHERE c.message_id = p_message_id
      )
    ) INTO v_result
  FROM messages m
  WHERE m.id = p_message_id;

  RETURN v_result;
END;
$$;
