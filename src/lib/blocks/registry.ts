export type BlockType = 'text' | 'hero' | 'section';

export type BlockFieldType = 'string' | 'date' | 'number' | 'boolean' | 'blocks';

type BlockFieldBase = {
	key: string;
	label: string;
	required?: boolean;
};

export type BlockFieldDefinition =
	| (BlockFieldBase & { type: 'string' | 'date' | 'number' | 'boolean' })
	| (BlockFieldBase & {
			type: 'blocks';
			blocks?: {
				allowedTypes?: BlockType[];
			};
	  });

export type BlockDefinition = {
	type: BlockType;
	label: string;
	fields: BlockFieldDefinition[];
};

export const BLOCK_REGISTRY: Record<BlockType, BlockDefinition> = {
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
			{ key: 'description', label: 'Description', type: 'string' },
			{ key: 'publishedOn', label: 'Published on', type: 'date' },
			{ key: 'priority', label: 'Priority', type: 'number' }
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

export const isBlockType = (type: string): type is BlockType => type in BLOCK_REGISTRY;

export const getBlockDefinition = (type: string): BlockDefinition | null =>
	isBlockType(type) ? BLOCK_REGISTRY[type] : null;

export const listBlockDefinitions = (): BlockDefinition[] => Object.values(BLOCK_REGISTRY);
