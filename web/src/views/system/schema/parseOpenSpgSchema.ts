/**
 * Parser for OpenSPG .schema DSL (namespace + EntityType blocks).
 */

export interface ParsedSchemaProperty {
	nameEn: string;
	nameZh: string;
	type: string;
	index?: string;
	constraints: string[];
}

export interface ParsedSchemaRelation {
	nameEn: string;
	nameZh: string;
	targetType: string;
}

export interface ParsedSchemaEntity {
	nameEn: string;
	nameZh: string;
	desc?: string;
	properties: ParsedSchemaProperty[];
	relations: ParsedSchemaRelation[];
}

export interface ParsedOpenSpgSchema {
	namespace: string;
	entities: ParsedSchemaEntity[];
}

export interface ParsedSchemaStats {
	namespace: string;
	entities: number;
	relations: number;
	properties: number;
	constraint: number;
	indexCount: number;
}

const ENTITY_HEADER_RE = /^([A-Za-z_]\w*)\(([^)]*)\):\s*EntityType\s*$/;
const NAMED_FIELD_RE = /^(\w+)\(([^)]*)\):\s*(\S+)\s*$/;
const NAMESPACE_RE = /^namespace\s+([A-Za-z_]\w*)\s*$/;

function stripComments(line: string): string {
	const idx = line.indexOf('#');
	return idx >= 0 ? line.slice(0, idx) : line;
}

function leadingIndent(line: string): number {
	const m = line.match(/^(\s*)/);
	return m ? m[1].replace(/\t/g, '  ').length : 0;
}

export function parseOpenSpgSchema(raw: string): ParsedOpenSpgSchema {
	const text = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
	const lines = text.split('\n');

	let namespace: string | null = null;
	const entities: ParsedSchemaEntity[] = [];
	let current: ParsedSchemaEntity | null = null;
	let section: 'none' | 'properties' | 'relations' = 'none';
	let lastProperty: ParsedSchemaProperty | null = null;
	let entitySectionIndent = 0;

	for (let i = 0; i < lines.length; i++) {
		const line = stripComments(lines[i]).trimEnd();
		const trimmed = line.trim();
		if (!trimmed) continue;

		const indent = leadingIndent(line);

		const nsMatch = trimmed.match(NAMESPACE_RE);
		if (nsMatch) {
			if (entities.length > 0 || current) {
				throw new SyntaxError(`Line ${i + 1}: 'namespace' must appear before entity definitions.`);
			}
			namespace = nsMatch[1];
			continue;
		}

		const entityMatch = trimmed.match(ENTITY_HEADER_RE);
		if (entityMatch && indent === 0) {
			current = {
				nameEn: entityMatch[1],
				nameZh: entityMatch[2].trim(),
				properties: [],
				relations: [],
			};
			entities.push(current);
			section = 'none';
			lastProperty = null;
			entitySectionIndent = 0;
			continue;
		}

		if (!current) {
			if (!namespace) {
				throw new SyntaxError(
					`Line ${i + 1}: Missing 'namespace' definition at the beginning of the file.`
				);
			}
			throw new SyntaxError(`Line ${i + 1}: Unexpected content before first EntityType.`);
		}

		if (/^desc:\s*(.+)$/.test(trimmed)) {
			current.desc = trimmed.replace(/^desc:\s*/, '').trim();
			continue;
		}

		if (/^properties:\s*$/.test(trimmed)) {
			section = 'properties';
			entitySectionIndent = indent;
			lastProperty = null;
			continue;
		}

		if (/^relations:\s*$/.test(trimmed)) {
			section = 'relations';
			entitySectionIndent = indent;
			lastProperty = null;
			continue;
		}

		const indexMatch = trimmed.match(/^index:\s*(.+)$/);
		if (indexMatch && lastProperty && section === 'properties') {
			lastProperty.index = indexMatch[1].trim();
			continue;
		}

		const constraintMatch = trimmed.match(/^constraint:\s*(.+)$/);
		if (constraintMatch && lastProperty && section === 'properties') {
			lastProperty.constraints = constraintMatch[1]
				.split(',')
				.map((c) => c.trim())
				.filter(Boolean);
			continue;
		}

		const fieldMatch = trimmed.match(NAMED_FIELD_RE);
		if (fieldMatch && indent > entitySectionIndent) {
			const [, nameEn, nameZh, type] = fieldMatch;
			if (section === 'properties') {
				const prop: ParsedSchemaProperty = {
					nameEn,
					nameZh: nameZh.trim(),
					type,
					constraints: [],
				};
				current.properties.push(prop);
				lastProperty = prop;
			} else if (section === 'relations') {
				current.relations.push({
					nameEn,
					nameZh: nameZh.trim(),
					targetType: type,
				});
				lastProperty = null;
			}
			continue;
		}
	}

	if (!namespace) {
		throw new SyntaxError("Missing 'namespace' definition at the beginning of the file.");
	}

	if (entities.length === 0) {
		throw new SyntaxError('No EntityType definitions found in schema file.');
	}

	return { namespace, entities };
}

export function getParsedSchemaStats(parsed: ParsedOpenSpgSchema): ParsedSchemaStats {
	let properties = 0;
	let constraint = 0;
	let indexCount = 0;
	let relations = 0;

	for (const entity of parsed.entities) {
		properties += entity.properties.length;
		relations += entity.relations.length;
		for (const prop of entity.properties) {
			if (prop.constraints.length > 0) constraint += 1;
			if (prop.index) indexCount += 1;
		}
	}

	return {
		namespace: parsed.namespace,
		entities: parsed.entities.length,
		relations,
		properties,
		constraint,
		indexCount,
	};
}
