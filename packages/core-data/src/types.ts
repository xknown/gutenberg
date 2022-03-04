export interface EntityDeclaration {
	baseURL?: string;
	baseURLParams?: Record< string, string | number >;
	getTitle?(): ( record: unknown ) => string;
	key?: string;
	kind: string;
	label?: string;
	name: string;
	plural?: string;
	rawAttributes?: string[];
	title?: string;
	transientEdits?: { blocks: boolean };
}
