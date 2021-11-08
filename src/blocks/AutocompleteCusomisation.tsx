import React, { useState } from 'react';
import {
  blockConfigFor,
  Button,
  useApi,
  useUser,
  useRouteContext,
  Form,
  UpdateModelConfigRequest,
} from '@madoc.io/types';
import { useMutation, useQuery } from 'react-query';
import styled from 'styled-components';

const AutocompleteContainer = styled.div`
  display: flex;
  max-width: 550px;

  input {
    padding: 0.3em;
    margin-right: 0.5em;
    flex: 1 1 0px;
  }
`;

const Heading3 = styled.h3`
  margin-top: 0.4em;
`;

export const AutocompleteCustomisation = ({
  heading,
  actionLabel,
  property,
  pattern,
  adminMessage,
  thanks,
  autocompleteEndpoint,
}: {
  heading: string;
  actionLabel?: string;
  property: string;
  pattern: string;
  adminMessage: string;
  thanks: string;
  autocompleteEndpoint?: string;
}) => {
  const { projectId, manifestId } = useRouteContext();
  const api = useApi();
  const user = useUser();
  const [newId, setNewId] = useState('');

  const [create, createStatus] = useMutation(async (newEndpoint: string) => {
    if (projectId && manifestId) {
      const request: UpdateModelConfigRequest = {
        id: 'update-model-config',
        summary:
          adminMessage ||
          `User ${user?.name} wants to update the autocomplete endpoint (manifest: ${manifestId} in project ${projectId})`,
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

  const initialResults = useQuery(
    ['muya-plugin/autocomplete', { autocompleteEndpoint }],
    async () => {
      if (autocompleteEndpoint) {
        return await fetch(autocompleteEndpoint)
          .then((r) => r.json())
          .then((r) =>
            r.completions.map((comp: any) => ({
              label: comp.label,
              value: comp.uri,
            }))
          );
      }
    },
    { enabled: !!autocompleteEndpoint }
  );

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
        {autocompleteEndpoint ? (
          <div style={{ flex: '1 1 0px', marginRight: '0.5em' }}>
            <Form.DefaultSelect
              inputId="role"
              initialValue={newId}
              isLoading={initialResults.isLoading}
              options={initialResults.data || []}
              renderOptionLabel={({ label }) => <div style={{ lineHeight: '1.8em' }}>{label}</div>}
              getOptionLabel={({ label }) => label}
              getOptionValue={({ value }) => value}
              onOptionChange={(input) => {
                setNewId(input?.value || '');
              }}
            />
          </div>
        ) : (
          <input
            disabled={createStatus.isLoading}
            type="text"
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
          />
        )}
        <Button disabled={createStatus.isLoading || !newId} $primary onClick={() => create(newId)}>
          {createStatus.isLoading ? 'loading...' : actionLabel || 'Submit'}
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
    property: {
      type: 'text-field',
      label: 'Property',
      description: 'The property name from your capture model for this project.',
    },
    pattern: {
      type: 'text-field',
      label: 'Pattern for submitting',
      description:
        'You can define a pattern. e.g. /my-api?tei=$id&query=% will replace $id with whatever the user inputs.',
    },
    thanks: { type: 'text-field', label: 'Thank you message' },
    adminMessage: {
      type: 'text-field',
      label: 'Admin message',
      description: 'This will be shown to an admin when they approve the request',
    },
    autocompleteEndpoint: {
      type: 'text-field',
      label: 'Autocomplete endpoint',
      description: 'This will the input to a controlled list, instead of a text box',
    },
  },
  anyContext: [],
  defaultProps: {
    heading: '',
    property: '',
    pattern: '',
    actionLabel: 'Submit',
    autocompleteEndpoint: '',
    thanks: 'Thank you',
    adminMessage: 'A user wants to update an autocomplete endpoint',
  },
});
