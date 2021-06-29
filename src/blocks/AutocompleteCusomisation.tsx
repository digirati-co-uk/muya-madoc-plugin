import React, { useState } from 'react';
import { blockConfigFor, Button, useApi, useUser, useRouteContext } from '@madoc.io/types';
import { useMutation } from 'react-query';
import type { UpdateModelConfigRequest } from '@madoc.io/types/dist/gateway/api-definitions/update-model-config';

export const AutocompleteCustomisation = ({
  property,
  pattern,
  adminMessage,
  thanks,
}: {
  property: string;
  pattern: string;
  adminMessage: string;
  thanks: string;
}) => {
  const { projectId, manifestId } = useRouteContext();
  const api = useApi();
  const user = useUser();
  const [newId, setNewId] = useState('');

  const [create, createStatus] = useMutation(async (newEndpoint: string) => {
    if (projectId && manifestId) {
      const request: UpdateModelConfigRequest = {
        id: 'update-model-config',
        summary: adminMessage || `User ${user?.name} wants to update the autocomplete endpoint (manifest: ${manifestId} in project ${projectId})`,
        body: {
          documentChanges: [
            {
              property,
              field: 'dataSource',
              value: pattern ? pattern.replace(/%/, newEndpoint) : newEndpoint,
            },
          ],
        },
        query: {
          project_id: projectId,
          manifest_id: manifestId,
        },
        params: {},
      };

      await api.createDelegatedRequest(request);
    }
  });

  if (!property) {
    return null;
  }

  if (!projectId || !manifestId) {
    return null;
  }

  if (createStatus.isSuccess) {
    return <div>{thanks}</div>;
  }

  if (createStatus.isError) {
    return <div>Something went wrong</div>;
  }

  return (
    <div>
      <input disabled={createStatus.isLoading} type="text" value={newId} onChange={(e) => setNewId(e.target.value)} />
      <Button disabled={createStatus.isLoading} onClick={() => create(newId)}>
        Submit
      </Button>
    </div>
  );
};

blockConfigFor(AutocompleteCustomisation, {
  type: 'MuyaMadocPlugin.AutocompleteCustomisation',
  label: 'Customise TEI autocomplete',
  requiredContext: ['manifest', 'project'],
  editor: {
    property: { type: 'text-field' },
    pattern: { type: 'text-field' },
    thanks: { type: 'text-field' },
    adminMessage: { type: 'text-field' },
  },
  anyContext: [],
  defaultProps: {
    property: '',
    pattern: '',
    thanks: 'Thank you',
    adminMessage: 'A user wants to update an autocomplete endpoint',
  },
});
