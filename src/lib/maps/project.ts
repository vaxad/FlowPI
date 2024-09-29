import { Attribute, Entity, Relation } from "@/lib/types/project";

export const capitalize = (s: string): string => {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

export const attributeTypeToPrismaType = (attributeType: Attribute): string => {

    if(attributeType === "string" || attributeType === "boolean")
    return capitalize(attributeType);

    if(attributeType === "number")
    return "BigInt";

    if(attributeType === "Date")
    return "DateTime";

    if(attributeType.includes("[]")){
      return `${attributeTypeToPrismaType(attributeType.slice(0,-2) as Attribute)}[]`;
    }

    return "String";
}

export const attributeTypeToInputType = (attributeType: Attribute): string => {
    if(attributeType === "string")
    return "text";

    if(attributeType === "number")
    return "number";

    if(attributeType === "boolean")
    return "checkbox";

    if(attributeType === "Date")
    return "date";

    if(attributeType.includes("[]")){
      return "text";
    }

    return "text";
}


export const attributeTypes: Attribute[] = ["string", "number", "boolean", "Date", "string[]", "number[]", "boolean[]", "Date[]"];

export const constraintTypes: string[] = ["required", "unique", "optional"];

export const relationTypes: string[] = ["1-1", "1-m", "m-1"];

export const generateRelationField = (relation: Relation): string => {
    const { from, to, type } = relation;
  
    const isSelfRelation = from === to;
    const relationName = isSelfRelation ? `${from}Relation` : '';
    const toLower = to.toLowerCase();
  
    switch (type) {
      case "1-1":
        return `${toLower} ${to} @relation(fields: [${toLower}Id], references: [id]${relationName ? `, name: "${relationName}"` : ''})\n  ${toLower}Id String @db.ObjectId`;
  
      case "1-m":
        return `${toLower} ${to}[]\n  ${toLower}Id String @db.ObjectId${isSelfRelation ? ` @relation(name: "${relationName}")` : ''}`;
  
      case "m-1":
        return `${toLower} ${to} @relation(fields: [${toLower}Id], references: [id]${relationName ? `, name: "${relationName}"` : ''})\n  ${toLower}Id String @db.ObjectId`;
    }
  };

  export const handleConstraints = (attribute: Entity["attributes"][number]): string => {

    const { constraint } = attribute;
    if (!constraint) return "";
  
    switch (constraint.type) {
      case "required":
        return "";
      case "optional":
        return "?";
      case "unique":
        return "@unique";
      case "default":
        return `@default(${getValue(attribute)})`;
      default:
        return "";
    }
  };

  export const getValue = (attribute: Entity["attributes"][number]): any => {
    if(attribute.type === "string") return `"${attribute.constraint?.value}"`;
    if(attribute.type === "number") return parseFloat(attribute.constraint?.value || "0");
    if(attribute.type === "boolean") return attribute.constraint?.value === "true";
    if(attribute.type === "Date") return new Date(attribute.constraint?.value || new Date());
    if(Array.isArray(attribute.type)) return (attribute.constraint?.value || "").trim().split(",");
  }


  export const ensureUserModel = (entities: Entity[]): Entity[] => {
    // Check if "User" or "user" model exists
    let userEntity = entities.find(entity => entity.name.toLowerCase() === "user");
  
    if (!userEntity) {
      // If user model does not exist, create it
      userEntity = {
        name: "User",
        attributes: [
          { name: "email", type: "string", constraint: { type: "unique" } },
          { name: "password", type: "string" }
        ]
      };
      entities.push(userEntity);
    } else {
      // Ensure "email" and "password" fields exist in the "User" model
      const emailField = userEntity.attributes.find(attr => attr.name === "email");
      const passwordField = userEntity.attributes.find(attr => attr.name === "password");
  
      if (!emailField) {
        userEntity.attributes.push({ name: "email", type: "string", constraint: { type: "unique" } });
      }else{
        emailField.constraint = { type: "unique" };
      }
  
      if (!passwordField) {
        userEntity.attributes.push({ name: "password", type: "string"});
      }else{
        passwordField.type = "string";
        passwordField.constraint = undefined;
      }
    }
  
    return entities;
  };


export const ensureRelations = (relations: Relation[]): Relation[] => {
    relations.forEach((relation) => {
      const { from, to, type } = relation;
      relations.push({ from: to, to: from, type: type.split("").reverse().join("") as Relation["type"], name: relation.name });
    });
    
    return relations;
}