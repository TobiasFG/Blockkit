export type BlockFieldType = 'string' | 'date' | 'number' | 'boolean' | 'blocks';

export type BlockFieldDefinition = {
	key: string;
	label: string;
	type: BlockFieldType;
	required?: boolean;
	blocks?: {
		allowedTypes?: string[];
	};
};

export type BlockDefinition = {
	type: string;
	label: string;
	fields: BlockFieldDefinition[];
};

export const BLOCK_REGISTRY: Record<string, BlockDefinition> = {
	text: {
		type: 'text',
		label: 'Text',
		fields: [{ key: 'body', label: 'Body', type: 'string', required: true }]
	},
	hero: {
		type: 'hero',
		label: 'Hero',
		fields: [
			{ key: 'heading', label: 'Heading', type: 'string', required: true },
			{ key: 'publishedOn', label: 'Published on', type: 'date' },
			{ key: 'priority', label: 'Priority', type: 'number' },
			{ key: 'featured', label: 'Featured', type: 'boolean' }
		]
	},
	section: {
		type: 'section',
		label: 'Section',
		fields: [
			{ key: 'title', label: 'Title', type: 'string' },
			{
				key: 'items',
				label: 'Items',
				type: 'blocks',
				blocks: {
					allowedTypes: ['text', 'hero', 'section']
				}
			}
		]
	}
};

export const getBlockDefinition = (type: string): BlockDefinition | null => BLOCK_REGISTRY[type] ?? null;

export const listBlockDefinitions = (): BlockDefinition[] => Object.values(BLOCK_REGISTRY);
