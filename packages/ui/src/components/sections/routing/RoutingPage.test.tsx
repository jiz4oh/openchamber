import React, { act } from 'react';
import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { createRoot, type Root } from 'react-dom/client';
import { Window } from 'happy-dom';

type ConfigState = {
  providers: Array<{
    id: string;
    models: Array<{
      id: string;
      variants?: Array<{ id: string; settings?: Record<string, unknown> }>;
    }>;
  }>;
  settingsDefaultModel: string;
  settingsDefaultVariant: string | null;
};

const configState: ConfigState = {
  providers: [],
  settingsDefaultModel: '',
  settingsDefaultVariant: null,
};

const routingState = {
  available: true,
  autoReady: true,
  config: {
    enabled: true,
    fallback: {
      model: { providerID: 'openai', modelID: 'gpt-6-sol' },
      variant: null,
    },
    minConfidence: 0.5,
    safetyNet: { enabled: false, threshold: 0.5 },
    categories: [],
  },
  builtins: [],
  loaded: true,
  loadError: null,
  load: async () => undefined,
  saveConfig: async () => undefined,
};

mock.module('@/stores/useConfigStore', () => ({
  useConfigStore: <T,>(selector: (state: ConfigState) => T): T => selector(configState),
}));

mock.module('@/stores/useRoutingStore', () => ({
  useRoutingStore: <T,>(selector: (state: typeof routingState) => T): T => selector(routingState),
}));

mock.module('@/lib/i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

mock.module('@/lib/persistence', () => ({
  reportSettingsSaveState: () => undefined,
}));

mock.module('@/lib/runtime-switch', () => ({
  getRuntimeKey: () => 'test-runtime',
}));

mock.module('@/lib/modelIdentifier', () => ({
  parseModelIdentifier: () => null,
}));

mock.module('@/lib/routing/autoModel', () => ({
  isAutoModel: () => false,
}));

mock.module('@/components/chat/mobileControlsUtils', () => ({
  isPrimaryMode: () => true,
}));

mock.module('@/components/sections/agents/ModelSelector', () => ({
  ModelSelector: () => <div />,
}));

mock.module('@/components/sections/commands/AgentSelector', () => ({
  AgentSelector: () => <div />,
}));

mock.module('@/components/sections/classification/JevAccessNote', () => ({
  JevAccessNote: () => null,
}));

mock.module('@/components/sections/shared/SettingsPageLayout', () => ({
  SettingsPageLayout: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));

mock.module('@/components/sections/shared/SettingsSection', () => ({
  SETTINGS_CUSTOM_TRIGGER_CLASS: '',
  SETTINGS_DESCRIPTION_CLASS: '',
  SETTINGS_FIELDS_STACK_CLASS: '',
  SETTINGS_HELPER_CLASS: '',
  SETTINGS_OPTION_STACK_CLASS: '',
  SETTINGS_SELECT_ROW_TRIGGER_CLASS: '',
  SETTINGS_SELECT_SIZE: 'sm',
  SettingsCheckboxRow: () => null,
  SettingsFieldRow: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SettingsSection: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
  SettingsStackedField: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SettingsTwoColumn: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

mock.module('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <div data-value={value}>{children}</div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

mock.module('@/components/ui/button', () => ({
  Button: ({ children }: { children?: React.ReactNode }) => <button type="button">{children}</button>,
}));

mock.module('@/components/ui/input', () => ({
  Input: () => <input />,
}));

mock.module('@/components/ui/textarea', () => ({
  Textarea: () => <textarea />,
}));

mock.module('@/components/ui/switch', () => ({
  Switch: () => <button type="button" />,
}));

mock.module('@/components/icon/Icon', () => ({
  Icon: () => <span />,
}));

mock.module('@/lib/utils', () => ({
  cn: (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' '),
}));

const { RoutingPage } = await import('./RoutingPage');

describe('RoutingPage model variants', () => {
  let windowInstance: Window;
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(() => {
    configState.providers = [{
      id: 'openai',
      models: [{
        id: 'gpt-6-sol',
        variants: [
          { id: 'none' },
          { id: 'low' },
          { id: 'medium' },
          { id: 'high' },
        ],
      }],
    }];

    windowInstance = new Window({ url: 'http://localhost/' });
    Object.assign(globalThis, {
      window: windowInstance,
      document: windowInstance.document,
      navigator: windowInstance.navigator,
      Node: windowInstance.Node,
      Element: windowInstance.Element,
      HTMLElement: windowInstance.HTMLElement,
      Event: windowInstance.Event,
      MutationObserver: windowInstance.MutationObserver,
      getComputedStyle: windowInstance.getComputedStyle.bind(windowInstance),
      requestAnimationFrame: windowInstance.requestAnimationFrame.bind(windowInstance),
      cancelAnimationFrame: windowInstance.cancelAnimationFrame.bind(windowInstance),
      IS_REACT_ACT_ENVIRONMENT: true,
    });

    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    windowInstance.close();
  });

  test('uses OpenCode v2 variant ids instead of array indices', async () => {
    await act(async () => {
      root.render(<RoutingPage />);
      await Promise.resolve();
    });

    const values = Array.from(host.querySelectorAll('[data-value]'))
      .map((element) => element.getAttribute('data-value'));

    expect(values).toEqual(['__default__', 'none', 'low', 'medium', 'high']);
    expect(values).not.toContain('0');
    expect(values).not.toContain('1');
    expect(values).not.toContain('2');
  });
});
