"use client"
import { addEdge, Background, BackgroundVariant, ControlButton, Controls, MiniMap, ReactFlow, useEdgesState, useNodesState } from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { useCallback } from 'react';
import EntityNode, { EntityNodeProps } from './entity-node';
import { PlusIcon } from 'lucide-react';
import RelationEdge, { RelationEdgeProps } from './relation-edge';
import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { GenerateFormData } from '@/lib/types/generate-form';
import { checkData } from '@/lib/utils';

const initialNodes: EntityNodeProps[] = [
    { id: '1', position: { x: 10, y: 10 }, data: { name: '', attributes: [{ name: "", type: "string" }], open: true }, type: 'entity' },
    { id: '2', position: { x: 400, y: 400 }, data: { name: '', attributes: [{ name: "", type: "string" }], open: true }, type: 'entity' },
];
const initialEdges: RelationEdgeProps[] = [{ id: 'e1-2', source: '1', target: '2', type: "relation", data: { type: "1-m" } }];

const edgeTypes = {
    'relation': RelationEdge
};

const nodeTypes = {
    'entity': EntityNode,
};

export default function Flow() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const [auth, setAuth] = React.useState(false);

    const onConnect = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (params: any) => setEdges((eds) => addEdge({ ...params, type: "relation", data: { type: "1-m" } }, eds)),
        [setEdges],
    )

    async function generateProject() {
        try {
            const data: GenerateFormData = {
                name: "flow-generated-backend",
                description: "This project was generated using FlowPI",
                auth: auth,
                entities: nodes.map((node) => {
                    const { data } = node as EntityNodeProps;
                    return {
                        name: data.name,
                        attributes: data.attributes.map((attr) => {
                            return {
                                name: attr.name,
                                type: attr.type,
                            }
                        })
                    }
                }),
                relations: edges.map((edge) => {
                    const { data } = edge as RelationEdgeProps;
                    return {
                        from: edge.source,
                        to: edge.target,
                        type: data?.type || "1-m",
                        name: `{edge.source}To{edge.target}`
                    }
                })
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
    }

    const createNode = () => {
        setNodes((nodes) => {
            return [
                ...nodes,
                {
                    id: (parseInt(nodes[nodes.length - 1]?.id || '0') + 1).toString(),
                    type: 'entity',
                    data: { name: '', attributes: [{ name: "", type: "string" }], open: true },
                    position: { x: (nodes[nodes.length - 1]?.position.x || 10) + 300, y: nodes[nodes.length - 1]?.position.y || 10 },
                } as EntityNodeProps,
            ];
        });
    }

    return (
        <>
            <div className='w-full relative flex-grow bg-purple-400/20 h-[80vh] rounded mt-4'>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                >
                    <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                    <Controls showZoom={false} orientation='horizontal' position="bottom-center" className='text-black flex' >
                        <ControlButton title='add entity' onClick={createNode}>
                            <PlusIcon size={20} />
                        </ControlButton>
                    </Controls>
                    <MiniMap />
                </ReactFlow>
            </div>
            <div className="flex justify-between items-center mt-4">
                <div className='flex gap-2 items-center'>
                    <Label className="text-xl font-semibold">Authentication:</Label>
                    <Switch checked={auth} onCheckedChange={() => { setAuth((prev) => !prev) }} />
                </div>
                <Button onClick={generateProject} type="button">Generate Project</Button>
            </div>
        </>
    )
}
