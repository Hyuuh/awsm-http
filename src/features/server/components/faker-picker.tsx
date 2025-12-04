import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { SearchIcon, Wand2Icon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

const FAKER_CATEGORIES = {
  Person: [
    { label: "First Name", value: "person.firstName" },
    { label: "Last Name", value: "person.lastName" },
    { label: "Full Name", value: "person.fullName" },
    { label: "Gender", value: "person.gender" },
    { label: "Job Title", value: "person.jobTitle" },
    { label: "Bio", value: "person.bio" },
  ],
  Internet: [
    { label: "Email", value: "internet.email" },
    { label: "Username", value: "internet.userName" },
    { label: "IP Address", value: "internet.ip" },
    { label: "URL", value: "internet.url" },
    { label: "Avatar", value: "internet.avatar" },
    { label: "Password", value: "internet.password" },
  ],
  Location: [
    { label: "Street Address", value: "location.streetAddress" },
    { label: "City", value: "location.city" },
    { label: "Country", value: "location.country" },
    { label: "Zip Code", value: "location.zipCode" },
    { label: "State", value: "location.state" },
    { label: "Latitude", value: "location.latitude" },
    { label: "Longitude", value: "location.longitude" },
  ],
  Company: [
    { label: "Company Name", value: "company.name" },
    { label: "Catch Phrase", value: "company.catchPhrase" },
    { label: "Buzz Phrase", value: "company.buzzPhrase" },
  ],
  Finance: [
    { label: "Amount", value: "finance.amount" },
    { label: "Account Name", value: "finance.accountName" },
    { label: "Currency Code", value: "finance.currencyCode" },
    { label: "Credit Card Number", value: "finance.creditCardNumber" },
  ],
  Date: [
    { label: "Past Date", value: "date.past" },
    { label: "Future Date", value: "date.future" },
    { label: "Birthdate", value: "date.birthdate" },
    { label: "Recent Date", value: "date.recent" },
  ],
  Random: [
    { label: "Integer", value: "number.int" },
    { label: "Float", value: "number.float" },
    { label: "Boolean", value: "datatype.boolean" },
    { label: "UUID", value: "string.uuid" },
    { label: "Alpha Numeric", value: "string.alphanumeric" },
  ],
  Commerce: [
    { label: "Product Name", value: "commerce.productName" },
    { label: "Price", value: "commerce.price" },
    { label: "Department", value: "commerce.department" },
    { label: "Product Description", value: "commerce.productDescription" },
  ],
};

interface FakerPickerProps {
  value?: string;
  onChange: (value: string) => void;
}

export function FakerPicker({ value, onChange }: FakerPickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<keyof typeof FAKER_CATEGORIES>("Person");
  const [search, setSearch] = useState("");

  const handleSelect = (val: string) => {
    onChange(`{{${val}}}`);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const filteredCategories = Object.entries(FAKER_CATEGORIES).reduce(
    (acc, [category, items]) => {
      const filteredItems = items.filter((item) =>
        item.label.toLowerCase().includes(search.toLowerCase())
      );
      if (filteredItems.length > 0) {
        acc[category as keyof typeof FAKER_CATEGORIES] = filteredItems;
      }
      return acc;
    },
    {} as typeof FAKER_CATEGORIES
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="relative group">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-6 w-full justify-start text-[10px] px-2 font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <Wand2Icon className="size-3 mr-2" />
            <span className="truncate flex-1 text-left">
              {value
                ? value.replace(/^\{\{|\}\}$/g, "")
                : "Select generator..."}
            </span>
          </Button>
          {value && (
            <div
              onClick={handleClear}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-sm cursor-pointer"
            >
              <XIcon className="size-3 text-muted-foreground hover:text-foreground" />
            </div>
          )}
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[500px] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-sm">Select Data Generator</DialogTitle>
          <div className="pt-2">
            <div className="relative">
              <SearchIcon className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search generators..."
                className="pl-8 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </DialogHeader>
        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <div className="w-48 border-r bg-muted/10 flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {Object.keys(FAKER_CATEGORIES).map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category as any)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors",
                      selectedCategory === category
                        ? "bg-primary text-primary-foreground font-medium"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col bg-background">
            <ScrollArea className="flex-1 p-4">
              <div className="grid grid-cols-2 gap-2">
                {(search
                  ? Object.values(filteredCategories).flat()
                  : FAKER_CATEGORIES[selectedCategory]
                )?.map((item) => (
                  <Button
                    key={item.value}
                    variant="outline"
                    className="justify-start h-auto py-2 px-3 text-left"
                    onClick={() => handleSelect(item.value)}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium">{item.label}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {item.value}
                      </span>
                    </div>
                  </Button>
                ))}
                {search && Object.keys(filteredCategories).length === 0 && (
                  <div className="col-span-2 text-center py-8 text-muted-foreground text-sm">
                    No generators found.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
