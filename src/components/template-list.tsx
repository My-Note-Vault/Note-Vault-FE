// src/components/TemplateList.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

type Template = {
  id: number;
  title: string;
  description: string;
  author: string;
};

type TemplateListProps = {
  templates: Template[];
};

export default function TemplateList({ templates }: TemplateListProps) {
  return (
    <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6">
      {templates.map((template) => (
        <Card key={template.id} className="hover:shadow-lg transition">
          <CardHeader className="p-0">
            <div className="w-full h-40 flex items-center justify-center bg-muted">
              <Eye className="h-10 w-10 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <CardTitle>{template.title}</CardTitle>
            <CardDescription>{template.description}</CardDescription>
            <p className="text-xs text-muted-foreground mt-2">by {template.author}</p>
            <Button variant="outline" size="sm" className="mt-4 w-full">
              보기
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
