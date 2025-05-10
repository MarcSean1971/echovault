
import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "./input"

interface DateTimePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  className?: string
}

export function DateTimePicker({
  date,
  setDate,
  className,
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)
  const [timeInputValue, setTimeInputValue] = React.useState<string>(
    date ? format(date, "HH:mm") : ""
  )

  // Update the time input value when the date changes
  React.useEffect(() => {
    if (date) {
      setTimeInputValue(format(date, "HH:mm"))
      setSelectedDate(date)
    } else {
      setTimeInputValue("")
      setSelectedDate(undefined)
    }
  }, [date])

  // Function to combine date and time
  const handleDateSelect = (selectedDate: Date | undefined) => {
    setSelectedDate(selectedDate)
    
    if (!selectedDate) {
      setDate(undefined)
      return
    }
    
    if (timeInputValue) {
      const [hours, minutes] = timeInputValue.split(":").map(Number)
      const newDate = new Date(selectedDate)
      newDate.setHours(hours || 0)
      newDate.setMinutes(minutes || 0)
      setDate(newDate)
    } else {
      setDate(selectedDate)
    }
  }

  // Function to handle time input changes
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setTimeInputValue(value)
    
    if (selectedDate && value) {
      const [hours, minutes] = value.split(":").map(Number)
      const newDate = new Date(selectedDate)
      newDate.setHours(hours || 0)
      newDate.setMinutes(minutes || 0)
      setDate(newDate)
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
      <div className="flex">
        <Input
          type="time"
          id="time"
          value={timeInputValue}
          onChange={handleTimeChange}
          className="w-full"
          placeholder="Select time"
        />
      </div>
    </div>
  )
}
