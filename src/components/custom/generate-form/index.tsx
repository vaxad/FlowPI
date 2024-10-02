"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { GenerateFormData, GenerateFormDataSchema } from "@/lib/types/generate-form"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Cross1Icon, Crosshair1Icon, TrashIcon } from "@radix-ui/react-icons"
import { ConstraintType } from "@/lib/types/project"
import Tooltip from "../tooltip"
import { attributeTypes, attributeTypeToInputType, constraintTypes, relationTypes } from "@/lib/maps/project"
import React from "react"
import { Label } from "@radix-ui/react-label"
import { Switch } from "@/components/ui/switch"
import { ErrorMessage } from '@hookform/error-message';
import { toast } from "sonner"
import { checkData } from "@/lib/utils"

export default function GenerateForm() {
    const form = useForm<GenerateFormData>({
        resolver: zodResolver(GenerateFormDataSchema),
        defaultValues: {
            name: "",
            description: "",
            entities: [{ name: '', attributes: [] }],
            relations: [],
            auth: false,
        },
    });

    const entities = form.watch('entities');

    const { fields: entityFields, append: addEntity, remove: removeEntity, update: updateEntity } = useFieldArray({
        control: form.control,
        name: "entities",
    });

    const { fields: relationFields, append: addRelation, remove: removeRelation } = useFieldArray({
        control: form.control,
        name: "relations",
    });

    const removeAttribute = (entityIndex: number, attributeIndex: number) => {
        const updatedEntity = form.getValues(`entities.${entityIndex}`);
        if (!updatedEntity) return;
        updatedEntity.attributes = [...updatedEntity.attributes].filter((_, idx) => idx !== attributeIndex);
        updateEntity(entityIndex, updatedEntity)
    }

    const addConstraint = (entityIndex: number, attributeIndex: number, constraintType: ConstraintType) => {
        const updatedEntity = form.getValues(`entities.${entityIndex}`);
        if (!updatedEntity) return;
        updatedEntity.attributes[attributeIndex].constraint = { type: constraintType };
        updateEntity(entityIndex, updatedEntity)
    }

    const removeConstraint = (entityIndex: number, attributeIndex: number) => {
        const updatedEntity = form.getValues(`entities.${entityIndex}`);
        if (!updatedEntity) return;
        updatedEntity.attributes[attributeIndex].constraint = undefined;
        updateEntity(entityIndex, updatedEntity)
    }

    const handleSubmit = async (data: GenerateFormData) => {
        try {
            if (Object.keys(form.formState.errors).length > 0) {
                return toast.error("Please fill in all required fields");
            }

            if (!checkData(data)) return;
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok || !response.body) {
                throw new Error(`Failed to fetch: ${response.statusText}`);
            }

            const reader = response.body.getReader();
            const chunks = [];
            let done = false;

            while (!done) {
                const { value, done: readerDone } = await reader.read();
                if (value) {
                    chunks.push(value); // Add each chunk to the array
                }
                done = readerDone;
            }
            const blob = new Blob(chunks, { type: 'application/zip' });

            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `${data.name.trim()}.zip`;
            document.body.appendChild(a);
            a.click();

            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error(error);
            alert("Something went wrong!");
        }
    };

    return (
        <Form {...form}>
            <h1 className="text-2xl font-bold py-2">Create a Project</h1>
            <Separator className="mb-2" />
            <form onSubmit={form.handleSubmit(handleSubmit)}>
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Input variant="underlined" sizeVariant="lg" placeholder="Enter project name" {...field} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem className="pt-2">
                            <FormControl>
                                <Textarea placeholder="Enter description" {...field} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <Separator className="mt-4 mb-2" />
                <h2 className="text-xl font-semibold">Entities</h2>
                {entityFields.map((entity, entityIndex) => (
                    <div key={entity.id} className="border rounded p-4 mt-2">
                        <FormField
                            control={form.control}
                            name={`entities.${entityIndex}.name`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input variant="underlined" placeholder="Enter entity name" {...field} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <h2 className="text-lg font-semibold mt-2">Attributes</h2>
                        {form.watch(`entities.${entityIndex}.attributes`)?.map((attr, attrIndex) => (
                            <div key={attrIndex} className="mt-2 flex gap-2 w-full">
                                <FormField
                                    control={form.control}
                                    name={`entities.${entityIndex}.attributes.${attrIndex}.type`}
                                    render={({ field }) => (
                                        <FormItem className=" min-w-32">
                                            <FormControl>
                                                <Select {...field} value={String(field.value)} defaultValue={attributeTypes[0]} onValueChange={field.onChange}  >
                                                    <SelectTrigger>
                                                        {field.value}
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {attributeTypes.map((attrType, idx) => (<SelectItem key={`attribute-type-select-${idx}`} value={String(attrType)}>{String(attrType)}</SelectItem>))}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`entities.${entityIndex}.attributes.${attrIndex}.name`}
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <FormControl>
                                                <Input placeholder="Enter attribute name" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                {form.getValues(`entities.${entityIndex}.attributes.${attrIndex}.constraint`) && (
                                    <>
                                        <FormField
                                            control={form.control}
                                            name={`entities.${entityIndex}.attributes.${attrIndex}.constraint.type`}
                                            render={({ field }) => (
                                                <FormItem className="min-w-48">
                                                    <FormControl>
                                                        <Select {...field} value={String(field.value)} defaultValue={constraintTypes[0]} onValueChange={field.onChange}  >
                                                            <SelectTrigger>
                                                                {field.value}
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {constraintTypes.map((constType, idx) => (<SelectItem key={`conatraint-type-select-${idx}`} value={String(constType)}>{String(constType)}</SelectItem>))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        {form.getValues(`entities.${entityIndex}.attributes.${attrIndex}.constraint.type`) === "default" && (
                                            <FormField
                                                control={form.control}
                                                name={`entities.${entityIndex}.attributes.${attrIndex}.constraint.value`}
                                                render={({ field }) => (
                                                    <FormItem className="w-full">
                                                        <FormControl>
                                                            <Input type={attributeTypeToInputType(attr.type)} placeholder="Enter default value" {...field} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </>
                                )}
                                {form.getValues(`entities.${entityIndex}.attributes.${attrIndex}.constraint`) ?
                                    <Tooltip title="remove constraint">
                                        <Button variant="secondary" className="p-1" type="button" onClick={() => removeConstraint(entityIndex, attrIndex)}>
                                            <Cross1Icon className="size-5" />
                                        </Button>
                                    </Tooltip>
                                    :
                                    <Tooltip title="add constraint">
                                        <Button variant="secondary" className="p-1" type="button" onClick={() => addConstraint(entityIndex, attrIndex, "required")}>
                                            <Crosshair1Icon className="size-5" />
                                        </Button>
                                    </Tooltip>
                                }
                                <Tooltip title="delete attribute">
                                    <Button variant="destructive" className="p-1" type="button" onClick={() => removeAttribute(entityIndex, attrIndex)}>
                                        <TrashIcon className="size-5" />
                                    </Button>
                                </Tooltip>
                            </div>
                        ))}
                        <div className="flex w-full justify-between pt-4">
                            <Button type="button" onClick={() => form.setValue(`entities.${entityIndex}.attributes`, [...form.getValues(`entities.${entityIndex}.attributes`), { name: '', type: 'string' }])}>
                                Add Attribute
                            </Button>
                            <Button type="button" onClick={() => removeEntity(entityIndex)}>
                                Remove Entity
                            </Button>
                        </div>
                    </div>
                ))}

                <Button type="button" className="mt-4 w-full" onClick={() => addEntity({ name: '', attributes: [{ name: '', type: 'string' }] })}>
                    Add Entity +
                </Button>
                {entities.length > 1 && (
                    <>
                        <Separator className="mt-4 mb-2" />
                        <h2 className="text-xl font-semibold">Relations</h2>
                        {relationFields.map((relation, relationIndex) => (
                            <div key={relation.id} className="border rounded p-4 mt-2">
                                <FormField
                                    control={form.control}
                                    name={`relations.${relationIndex}.name`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input variant="underlined" placeholder="Enter relation name" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <div className="mt-2 flex items-end gap-2 w-full">
                                    <FormField
                                        control={form.control}
                                        name={`relations.${relationIndex}.from`}
                                        render={({ field }) => (
                                            <FormItem className="w-full">
                                                <Label className="text-sm">From</Label>
                                                <FormControl>
                                                    <Select {...field} value={String(field.value)} onValueChange={field.onChange}>
                                                        <SelectTrigger>
                                                            {field.value || "From"}
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {entities.filter((i) => i && i.name && i.name.trim().length && i.name != form.getValues(`relations.${relationIndex}.to`)).map((ent, idx) => (<SelectItem key={`relation-from-select-${idx}`} value={String(ent.name)}>{String(ent.name)}</SelectItem>))}
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`relations.${relationIndex}.to`}
                                        render={({ field }) => (
                                            <FormItem className="w-full">
                                                <Label className="text-sm">To</Label>
                                                <FormControl>
                                                    <Select {...field} value={String(field.value)} onValueChange={field.onChange}  >
                                                        <SelectTrigger>
                                                            {field.value || "To"}
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {entities.filter((i) => i && i.name && i.name.trim().length && i.name != form.getValues(`relations.${relationIndex}.from`)).map((ent, idx) =>
                                                                (<SelectItem key={`relation-to-select-${idx}`} value={String(ent.name)}>{String(ent.name)}</SelectItem>))}
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`relations.${relationIndex}.type`}
                                        render={({ field }) => (
                                            <FormItem className="w-full">
                                                <Label className="text-sm">Type</Label>
                                                <FormControl>
                                                    <Select {...field} value={String(field.value)} defaultValue={relationTypes[0]} onValueChange={field.onChange}  >
                                                        <SelectTrigger>
                                                            {field.value}
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {relationTypes.map((relType, idx) =>
                                                                (<SelectItem key={`relation-type-select-${idx}`} value={String(relType)}>{String(relType)}</SelectItem>))}
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="button" onClick={() => removeRelation(relationIndex)}>
                                        Remove Relation
                                    </Button>
                                </div>
                            </div>
                        ))}

                        <div className="flex w-full justify-between pt-4">
                            <Button type="button" onClick={() => addRelation({ from: entities[0].name, to: entities[1].name, name: "", type: "1-m" })}>
                                Add Relation
                            </Button>
                        </div>
                    </>
                )}

                <FormField
                    control={form.control}
                    name={`auth`}
                    render={({ field }) => (
                        <FormItem className="flex space-y-0 py-2 gap-2 items-center">
                            <Label className="text-xl font-semibold">Authentication</Label>
                            <FormControl className="" >
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />
                <Button type="submit" className="mt-4 w-full">Generate Project</Button>
                <ul>
                    <li><ErrorMessage errors={form.formState.errors} name="auth" /></li>
                    <li><ErrorMessage errors={form.formState.errors} name="name" /></li>
                    <li><ErrorMessage errors={form.formState.errors} name="description" /></li>
                    <li><ErrorMessage errors={form.formState.errors} name="entities" /></li>
                    <li><ErrorMessage errors={form.formState.errors} name="relations" /></li>

                </ul>
            </form>
        </Form>
    )
}
