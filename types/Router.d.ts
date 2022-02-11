import { SvelteComponentTyped } from 'svelte';

interface RouterProps {
  basepath?: string;
  history?: Object;
}

export class Router extends SvelteComponentTyped<RouterProps> {}
