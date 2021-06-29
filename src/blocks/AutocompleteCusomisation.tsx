import React, { useState } from 'react';
import { blockConfigFor, Button, useApi, useUser, useRouteContext } from '@madoc.io/types';
import { useMutation } from 'react-query';
import styled from 'styled-components';
import type { UpdateModelConfigRequest } from '@madoc.io/types/dist/gateway/api-definitions/update-model-config';

const AutocompleteContainer = styled.div`
  display: flex;
  max-width: 550px;
  
  input {
    padding: .3em;
    margin-right: .5em;
    flex: 1 1 0px;
  }
`;

const Heading3 = styled.h3`
  margin-top: 0.4em;
`;


export const AutocompleteCustomisation = ({
  heading,
  property,
  pattern,
  adminMessage,
  thanks,
}: {
  heading: string;
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
              value: pattern ? pattern.replace(/\$id/, newEndpoint) : newEndpoint,
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
    <>
      {heading ? <Heading3>{heading}</Heading3> : null}
      <AutocompleteContainer>
        <input disabled={createStatus.isLoading} type="text" value={newId} onChange={(e) => setNewId(e.target.value)} />
        <Button disabled={createStatus.isLoading} $primary onClick={() => create(newId)}>
          Submit
        </Button>
      </AutocompleteContainer>
      </>
  );
};

blockConfigFor(AutocompleteCustomisation, {
  type: 'MuyaMadocPlugin.AutocompleteCustomisation',
  label: 'Customise TEI autocomplete',
  requiredContext: ['manifest', 'project'],
  editor: {
    heading: { type: 'text-field', label: 'Heading' },
    actionLabel: { type: 'text-field', label: 'Action label' },
    property: { type: 'text-field', label: 'Property', description: 'The property name from your capture model for this project.' },
    pattern: { type: 'text-field', label: 'Pattern for submitting', description: 'You can define a pattern. e.g. /my-api?tei=$id&query=% will replace $id with whatever the user inputs.' },
    thanks: { type: 'text-field', label: 'Thank you message' },
    adminMessage: { type: 'text-field', label: 'Admin message', description: 'This will be shown to an admin when they approve the request' },
  },
  anyContext: [],
  defaultProps: {
    heading: '',
    property: '',
    pattern: '',
    thanks: 'Thank you',
    adminMessage: 'A user wants to update an autocomplete endpoint',
  },
});
