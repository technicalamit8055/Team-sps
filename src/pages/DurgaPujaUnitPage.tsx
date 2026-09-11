import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSamiti } from '@/contexts/SamitiContext';
import { useAuth } from '@/hooks/useAuth';
import { DurgaPujaUnitView } from '@/components/samiti/DurgaPujaUnitView';

export const DurgaPujaUnitPage: React.FC = () => {
  const navigate = useNavigate();
  const { entities, currentEntity, setCurrentEntityId } = useSamiti();
  const { isCollector, assignedWorkspaceId } = useAuth();

  useEffect(() => {
    // Ensure active workspace entity is set to Durga Puja Unit
    const durgaEntity = entities.find(
      e => e.id === 'ent-durga-narayanpur' || e.type === 'festival_samiti'
    );
    if (durgaEntity && currentEntity.id !== durgaEntity.id) {
      setCurrentEntityId(durgaEntity.id);
    }
  }, [entities, currentEntity.id, setCurrentEntityId]);

  const isCollectorMode = isCollector || !!assignedWorkspaceId;

  return (
    <DurgaPujaUnitView
      isCollectorMode={isCollectorMode}
      onBackToMaster={() => navigate('/master')}
    />
  );
};

export default DurgaPujaUnitPage;
