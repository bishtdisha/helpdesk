-- Check Jay's user ID and tickets
SELECT 
    u.id as user_id,
    u.name,
    u.email,
    r.name as role_name,
    COUNT(t.id) as ticket_count
FROM users u
LEFT JOIN roles r ON u."roleId" = r.id
LEFT JOIN tickets t ON (t."createdBy" = u.id OR t."assignedTo" = u.id OR t."customerId" = u.id)
WHERE u.name LIKE '%Jay%'
GROUP BY u.id, u.name, u.email, r.name;

-- Show Jay's actual tickets
SELECT 
    t.id,
    t."ticketNumber",
    t.title,
    t.status,
    t.priority,
    t."createdBy",
    t."assignedTo",
    t."customerId",
    creator.name as created_by_name,
    assigned.name as assigned_to_name,
    customer.name as customer_name
FROM tickets t
LEFT JOIN users creator ON t."createdBy" = creator.id
LEFT JOIN users assigned ON t."assignedTo" = assigned.id
LEFT JOIN users customer ON t."customerId" = customer.id
WHERE creator.name LIKE '%Jay%' 
   OR assigned.name LIKE '%Jay%' 
   OR customer.name LIKE '%Jay%';
