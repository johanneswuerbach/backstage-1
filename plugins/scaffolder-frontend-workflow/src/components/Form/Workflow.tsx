import React from 'react';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { useCustomFieldExtensions } from '@backstage/plugin-scaffolder-react';
import {
  NextFieldExtensionOptions,
  WorkflowProps,
  useTemplateParameterSchema,
} from '@backstage/plugin-scaffolder-react/alpha';
import { ReactNode, useCallback } from 'react';
import { FormWrapper } from './FormWrapper';
import { JsonValue } from '@backstage/types';
import { useRunWorkflow } from '../../hooks/useRunWorkflow';
import { Progress } from '@backstage/core-components';
import { TaskProgress } from '../TaskProgress/TaskProgress';

type Props = Pick<
  WorkflowProps,
  'namespace' | 'templateName' | 'onCreate' | 'initialState'
> & {
  onComplete?: () => void;
  children: ReactNode;
  onError?: (e: Error) => void;
};

export function Workflow({
  namespace,
  templateName,
  onError,
  children,
  onComplete,
  ...props
}: Props): JSX.Element {
  const customFieldExtensions =
    useCustomFieldExtensions<NextFieldExtensionOptions<any, any>>(children);
  const templateRef = stringifyEntityRef({
    kind: 'Template',
    namespace: namespace,
    name: templateName,
  });

  const { loading, manifest } = useTemplateParameterSchema(templateRef);

  const { execute, taskStream } = useRunWorkflow({
    templateRef,
    onError,
    onComplete,
  });

  const handleNext = useCallback(
    async (formData: Record<string, JsonValue>) => {
      await execute(formData);
    },
    [execute],
  );

  const { width, height } = taskStream.loading
    ? { width: 'auto', height: 'auto' }
    : {
        width: Math.max(window.innerWidth / 2, 500),
        height: Math.max(window.innerHeight / 2, 650),
      };

  return (
    <div style={{ width, height }}>
      {loading && <Progress />}
      {manifest && taskStream.loading === true && (
        <FormWrapper
          extensions={customFieldExtensions}
          handleNext={handleNext}
          manifest={manifest}
          {...props}
        >
          {children}
        </FormWrapper>
      )}
      {taskStream.loading === false && <TaskProgress taskStream={taskStream} />}
    </div>
  );
}
