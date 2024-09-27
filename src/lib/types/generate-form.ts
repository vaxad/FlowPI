import { Entity, Relation } from "./project";
import { z } from 'zod';

const AttributeSchema = z.lazy<any>(() =>
  z.union([
    z.literal("string"),
    z.literal("number"),
    z.literal("boolean"),
    z.literal("Date"),
    z.literal("reference"),
    z.array(AttributeSchema) 
  ])
);

const ConstraintTypeSchema = z.union([
  z.literal("unique"),
  z.literal("optional"),
  z.literal("default")
]);

const ConstraintSchema = z.object({
  value: z.string().optional(),
  type: ConstraintTypeSchema,
});

const AttributeObjectSchema = z.object({
  name: z.string(),
  type: AttributeSchema,
  constraint: ConstraintSchema.optional(),
});

const MethodSchema = z.object({
  method: z.union([z.literal('GET'), z.literal('POST'), z.literal('PUT'), z.literal('DELETE')]),
  name: z.string().optional(),
  returns: z.array(z.literal("string")).optional(),
  isPaginated: z.boolean().optional(),
  requiresAuth: z.boolean().optional(),
});

const EntitySchema = z.object({
  name: z.string(),
  attributes: z.array(AttributeObjectSchema),
  advancedOptions: z.object({
    methods: z.array(MethodSchema),
  }).optional(),
});

const RelationSchema = z.object({
  from: z.string(),
  to: z.string(),
  type: z.union([z.literal("1-1"), z.literal("1-m"), z.literal("m-1"), z.literal("m-m")]),
  name: z.string(),
  attributes: z.array(AttributeObjectSchema),
});

export const GenerateFormDataSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  entities: z.array(EntitySchema),
  relations: z.array(RelationSchema),
  auth: z.boolean(),
});

export interface GenerateFormData {
    name: string;
    description?: string;
    entities: Entity[];
    relations: Relation[];
    auth: boolean;
}