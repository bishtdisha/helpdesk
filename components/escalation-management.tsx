'use client';

import { useState } from 'react';
import { EscalationRuleManager, EscalationRule } from './escalation-rule-manager';
import { EscalationRuleForm } from './escalation-rule-form';

export function EscalationManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<EscalationRule | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateClick = () => {
    setSelectedRule(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (rule: EscalationRule) => {
    setSelectedRule(rule);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedRule(null);
  };

  const handleFormSuccess = () => {
    // Trigger refresh of the rule list
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Escalation Management</h1>
        <p className="text-muted-foreground mt-2">
          Configure automated escalation rules to manage ticket workflows
        </p>
      </div>

      <EscalationRuleManager
        key={refreshKey}
        onCreateClick={handleCreateClick}
        onEditClick={handleEditClick}
      />

      <EscalationRuleForm
        open={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        rule={selectedRule}
      />
    </div>
  );
}
