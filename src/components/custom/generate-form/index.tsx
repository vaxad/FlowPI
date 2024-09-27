"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { GenerateFormData, GenerateFormDataSchema } from "@/lib/types/generate-form"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"

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

    const attributeTypes = ["string", "number", "boolean", "Date", "reference", "Attribute[]"];

    const { fields: entityFields, append: addEntity, remove: removeEntity } = useFieldArray({
        control: form.control,
        name: "entities",
    });

    const handleSubmit = async (data: GenerateFormData) => {
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            if (response.ok) {
                alert("Backend API generated and running!");
            } else {
                alert("Error: " + result.error);
            }
        } catch (error) {
            console.error(error);
            alert("Something went wrong!");
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Project Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter project name" {...field} />
                            </FormControl>
                            <FormDescription>Enter the name of your project</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter description" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {entityFields.map((entity, entityIndex) => (
                    <div key={entity.id} className="border p-4 mt-4">
                        <FormField
                            control={form.control}
                            name={`entities.${entityIndex}.name`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Entity Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter entity name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="button" onClick={() => form.setValue(`entities.${entityIndex}.attributes`, [...form.getValues(`entities.${entityIndex}.attributes`), { name: '', type: 'string' }])}>
                            Add Attribute
                        </Button>

                        {form.watch(`entities.${entityIndex}.attributes`)?.map((attr, attrIndex) => (
                            <div key={attrIndex} className="mt-2">
                                <FormField
                                    control={form.control}
                                    name={`entities.${entityIndex}.attributes.${attrIndex}.name`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Attribute Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter attribute name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name={`entities.${entityIndex}.attributes.${attrIndex}.type`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Attribute Type</FormLabel>
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
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        ))}
                        <Button type="button" onClick={() => removeEntity(entityIndex)} className="mt-4">
                            Remove Entity
                        </Button>
                    </div>
                ))}

                <Button type="button" onClick={() => addEntity({ name: '', attributes: [{ name: '', type: 'string' }] })}>
                    Add Entity
                </Button>

                <Button type="submit" className="mt-4">Generate Project</Button>
                <Button className="mt-4">
                    <a href="/generated-backend.zip" download="generated-backend.zip">Download Project</a>
                </Button>
            </form>
        </Form>
    )
}
