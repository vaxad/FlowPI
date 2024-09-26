"use client"
import { ChangeEvent, FormEvent, useState } from 'react';

function EntityForm() {
  const [entities, setEntities] = useState([{ name: '', attributes: [{ name: '', type: '' }] }]);

  const handleEntityChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const newEntities = [...entities];
    newEntities[index][event.target.name  as "name"] = event.target.value;
    setEntities(newEntities);
  };

  const handleAttributeChange = (entityIndex: number, attrIndex: number, event: ChangeEvent<HTMLInputElement>) => {
    const newEntities = [...entities];
    newEntities[entityIndex].attributes[attrIndex][event.target.name as "name" | "type"] = event.target.value;
    setEntities(newEntities);
  };

  const addEntity = () => {
    setEntities([...entities, { name: '', attributes: [{ name: '', type: '' }] }]);
  };

  const addAttribute = (index: number) => {
    const newEntities = [...entities];
    newEntities[index].attributes.push({ name: '', type: '' });
    setEntities(newEntities);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({entities}),
    });
  
    const data = await response.json();
    if (response.ok) {
      alert('Backend API generated and running!');
    } else {
      alert('Error: ' + data.error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {entities.map((entity, entityIndex) => (
        <div key={entityIndex}>
          <label>Entity Name:</label>
          <input
            name="name"
            value={entity.name}
            onChange={(e) => handleEntityChange(entityIndex, e)}
          />
          <button type="button" onClick={() => addAttribute(entityIndex)}>
            Add Attribute
          </button>
          {entity.attributes.map((attribute, attrIndex) => (
            <div key={attrIndex}>
              <label>Attribute Name:</label>
              <input
                name="name"
                value={attribute.name}
                onChange={(e) => handleAttributeChange(entityIndex, attrIndex, e)}
              />
              <label>Type:</label>
              <input
                name="type"
                value={attribute.type}
                onChange={(e) => handleAttributeChange(entityIndex, attrIndex, e)}
              />
            </div>
          ))}
        </div>
      ))}
      <button type="button" onClick={addEntity}>
        Add Entity
      </button>
      <button type="submit">Generate Project</button>
      <button type="button">
        <a href="/generated-backend.zip" download="generated-backend.zip">Download Project</a>
        </button>
    </form>
  );
}

export default EntityForm;
