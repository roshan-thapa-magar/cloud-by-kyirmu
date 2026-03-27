"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface FormField {
    name: string;
    label: string;
    type: "text" | "file";
    placeholder?: string;
}

interface FormBuilderProps {
    title: string;
    fields: FormField[];
    defaultValues?: any;
    onSubmit: (values: any) => Promise<void>;
}

export default function FormBuilder({
    title,
    fields,
    defaultValues = {},
    onSubmit,
}: FormBuilderProps) {
    const [formData, setFormData] = useState<any>(defaultValues);
    const [loading, setLoading] = useState(false);
    const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});

    useEffect(() => {
        setFormData(defaultValues);

        // Set initial image previews if editing
        const previews: Record<string, string> = {};
        fields.forEach((field) => {
            if (field.type === "file" && defaultValues[field.name]) {
                previews[field.name] = defaultValues[field.name];
            }
        });
        setImagePreviews(previews);
    }, [defaultValues, fields]);

    const handleChange = (name: string, value: any) => {
        setFormData((prev: any) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleFileChange = (name: string, file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            handleChange(name, base64);           // save Base64 in formData
            setImagePreviews((prev) => ({         // update preview
                ...prev,
                [name]: base64,
            }));
        };
        reader.readAsDataURL(file);
    };

const handleSubmit = async () => {
  for (const field of fields) {

    // skip file validation if editing and image already exists
    if (
      field.type === "file" &&
      defaultValues?.[field.name] &&
      !formData[field.name]
    ) {
      continue;
    }

    if (!formData[field.name]) {
      toast.error(`${field.label} is required`);
      return;
    }
  }

  setLoading(true);
  try {
    await onSubmit(formData);
  } finally {
    setLoading(false);
  }
};

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold">{title}</h2>

            {fields.map((field) => (
                <div key={field.name}>
                    <label className="text-sm">{field.label}</label>

                    {field.type === "text" ? (
                        <Input
                            placeholder={field.placeholder}
                            value={formData[field.name] || ""}
                            type="text"
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            required
                        />
                    ) : (
                        <>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e: any) =>
                                    e.target.files && handleFileChange(field.name, e.target.files[0])
                                }
                                required
                            />
                            {/* IMAGE PREVIEW */}
                            {imagePreviews[field.name] && (
                                <img
                                    src={imagePreviews[field.name]}
                                    alt="Preview"
                                    className="mt-2 w-32 h-32 object-cover rounded-md border"
                                />
                            )}
                        </>
                    )}
                </div>
            ))}

            <Button variant="default" className="w-full cursor-pointer" onClick={handleSubmit} disabled={loading}>
                {loading ? <span className="flex items-center gap-2">
                    Saving
                    <Loader2 className="h-4 w-4 animate-spin" />
                </span> : "Submit"}
            </Button>
        </div>
    );
}