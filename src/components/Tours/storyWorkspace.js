import React from 'react'

export function inviteStoriesWorkspaceSteps(intl, mobileLayout) {
  const steps = [];
  if (!mobileLayout) {
    steps.push({
      disableBeacon: true,
      target: `#${intl.formatMessage({ id: 'swimLanes' })}`,
      placement: 'right',
      title: 'The First Story',
      content: (
        <div>
          The first story beyond failed retros is <i>already</i> assigned to you.
        </div>
      )
    });
    steps.push({
      disableBeacon: true,
      target: `#${intl.formatMessage({ id: 'suggestions' })}`,
      placement: 'right',
      title: 'Suggestion for Reclaiming Retros',
      content: 'Once you add your team they can vote on using Uclusion.',
    });
  }
  steps.push({
    disableBeacon: true,
    target: '#adminManageCollaborators',
    placement: 'bottom',
    content: 'Click here to invite your team and avoid another useless retro!',
  })
  return steps;
}