'use client';

/**
 * Example usage of DynamicDropdownSelect component
 * 
 * This file demonstrates how to use the DynamicDropdownSelect component
 * with different endpoints (teams, users, customers) as required by the
 * enhanced ticket creation feature.
 */

import React, { useState } from 'react';
import { DynamicDropdownSelect } from './dynamic-dropdown-select';

// Type definitions for the different entities
interface Team {
  id: string;
  name: string;
  description?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  company?: string | null;
}

/**
 * Example: Team Selector
 */
export function TeamSelectorExample() {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Team</label>
      <DynamicDropdownSelect<Team>
        endpoint="/teams"
        value={selectedTeamId}
        onValueChange={setSelectedTeamId}
        placeholder="Select a team..."
        formatLabel={(team) => team.name}
        formatValue={(team) => team.id}
        formatSecondaryLabel={(team) => team.description || null}
        searchPlaceholder="Search teams..."
        emptyMessage="No teams found."
        responseKey="teams"
      />
    </div>
  );
}

/**
 * Example: User/Assignee Selector
 */
export function UserSelectorExample() {
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Assigned To</label>
      <DynamicDropdownSelect<User>
        endpoint="/users"
        value={selectedUserId}
        onValueChange={setSelectedUserId}
        placeholder="Select a user..."
        formatLabel={(user) => user.name}
        formatValue={(user) => user.id}
        formatSecondaryLabel={(user) => user.email}
        searchPlaceholder="Search users..."
        emptyMessage="No users found."
        responseKey="users"
      />
    </div>
  );
}

/**
 * Example: Customer Selector
 */
export function CustomerSelectorExample() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Customer</label>
      <DynamicDropdownSelect<Customer>
        endpoint="/customers"
        value={selectedCustomerId}
        onValueChange={setSelectedCustomerId}
        placeholder="Select a customer..."
        formatLabel={(customer) => customer.name}
        formatValue={(customer) => customer.id}
        formatSecondaryLabel={(customer) => 
          customer.company ? `(${customer.company})` : customer.email
        }
        searchPlaceholder="Search customers..."
        emptyMessage="No customers found."
        responseKey="customers"
      />
    </div>
  );
}

/**
 * Complete form example showing all three dropdowns together
 */
export function CompleteFormExample() {
  const [formData, setFormData] = useState({
    teamId: '',
    assignedTo: '',
    customerId: '',
  });

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Ticket Assignment</h3>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Customer *</label>
        <DynamicDropdownSelect<Customer>
          endpoint="/customers"
          value={formData.customerId}
          onValueChange={(value) => setFormData({ ...formData, customerId: value })}
          placeholder="Select a customer..."
          formatLabel={(customer) => customer.name}
          formatValue={(customer) => customer.id}
          formatSecondaryLabel={(customer) => 
            customer.company ? `(${customer.company})` : customer.email
          }
          searchPlaceholder="Search customers..."
          responseKey="customers"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Team</label>
        <DynamicDropdownSelect<Team>
          endpoint="/teams"
          value={formData.teamId}
          onValueChange={(value) => setFormData({ ...formData, teamId: value })}
          placeholder="Select a team..."
          formatLabel={(team) => team.name}
          formatValue={(team) => team.id}
          formatSecondaryLabel={(team) => team.description || null}
          searchPlaceholder="Search teams..."
          responseKey="teams"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Assigned To</label>
        <DynamicDropdownSelect<User>
          endpoint="/users"
          value={formData.assignedTo}
          onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
          placeholder="Select a user..."
          formatLabel={(user) => user.name}
          formatValue={(user) => user.id}
          formatSecondaryLabel={(user) => user.email}
          searchPlaceholder="Search users..."
          responseKey="users"
        />
      </div>

      <div className="pt-4 border-t">
        <pre className="text-xs bg-muted p-2 rounded">
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>
    </div>
  );
}
