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

    if(Array.isArray(attributeType)){
        return `${attributeTypeToPrismaType(attributeType[0])}[]`;
    }

    return "String";
}

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
  
      case "m-m":
        return `${toLower} ${to}[]${isSelfRelation ? ` @relation(name: "${relationName}")` : ''}`;
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
  