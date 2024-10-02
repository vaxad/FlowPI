import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { GenerateFormData } from "./types/generate-form";
import { toast } from "sonner";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const checkData = (data:GenerateFormData) => {
  if(data.entities.length === 0 ) {
      toast.error("Please add at least one entity");
      return false;
  }

  if(data.entities.find(entity => entity.name.trim().length === 0)) {
      toast.error("Please add a name to each entity");
      return false;
  }

  if(data.entities.find(entity => entity.attributes.length === 0)) {
      toast.error("Please add at least one attribute to each entity");
      return false;
  }

  if(data.entities.find(entity => entity.attributes.find(attr => attr.name === ""))) {
      toast.error("Please add a name to each attribute");
      return false;
  }

  return true;
}
