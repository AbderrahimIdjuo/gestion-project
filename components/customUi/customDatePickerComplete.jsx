"use client";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useForm, Controller } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { fr } from "date-fns/locale";
const CustomDatePickerComplete = ({ label }) => {
  const { watch, control } = useForm();
  const selectedDate = watch("echeance");

  useEffect;

  return (
    <>
      <Label htmlFor="client">{label} </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal hover:text-purple-600 hover:bg-white hover:border-2 hover:border-purple-500",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2" />
            {selectedDate ? (
              format(new Date(selectedDate), "PPP", {
                locale: fr,
              })
            ) : (
              <span>Choisis une date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Controller
            name="echeance"
            control={control}
            render={({ field }) => (
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={(date) => {
                  if (date) {
                    // Set to midnight UTC
                    const utcMidnight = new Date(
                      Date.UTC(
                        date.getFullYear(),
                        date.getMonth(),
                        date.getDate()
                      )
                    );
                    field.onChange(utcMidnight);
                  }
                }}
                initialFocus
              />
            )}
          />
        </PopoverContent>
      </Popover>
    </>
  );
};

export default CustomDatePickerComplete;
