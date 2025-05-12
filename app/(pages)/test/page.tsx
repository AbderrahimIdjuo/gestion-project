"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import countries from "@/app/countries.json";
import Image from "next/image";
import { useState } from "react";

const phoneSchema = z.object({
  countryCode: z.string().min(1, "Choisissez un pays"),
  number: z
    .string()
    .regex(/^\d{9}$/, "Le numéro doit contenir exactement 9 chiffres"),
});

type PhoneFormData = z.infer<typeof phoneSchema>;

export default function PhoneNumberInput() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
  });

  const [selectedCountry, setSelectedCountry] = useState(countries[0]);

  const onSubmit = (data: PhoneFormData) => {
    const fullNumber = `${data.countryCode}${data.number}`;
    console.log("Numéro complet :", fullNumber);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dialCode = e.target.value;
    const country = countries.find((c) => c.dial_code === dialCode);
    if (country) {
      setSelectedCountry(country);
      setValue("countryCode", dialCode);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
      <div>
        <label htmlFor="countryCode" className="block mb-1 font-medium">
          Code pays
        </label>
        <div className="relative">
          <select
            id="countryCode"
            {...register("countryCode")}
            onChange={handleCountryChange}
            className="appearance-none border pl-[4rem] p-2 rounded w-full pr-8"
          >
            <option value="">-- Sélectionner un pays --</option>
            {countries.map((country) => (
              <option  key={country.code} value={country.dial_code}>
                {country.name} ({country.dial_code})
              </option>
            ))}
          </select>
          {/* Flag next to the selected country */}
          {selectedCountry && (
            <div className="absolute top-1/2 left-2 -translate-y-1/2">
              <img
                src={selectedCountry.flag}
                alt={selectedCountry.name}
  
                className="inline-block rounded-sm w-12 h-8"
              />
            </div>
          )}
        </div>
        {errors.countryCode && (
          <p className="text-red-500 text-sm mt-1">
            {errors.countryCode.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="number" className="block mb-1 font-medium">
          Numéro (9 chiffres)
        </label>
        <input
          type="text"
          id="number"
          maxLength={9}
          {...register("number")}
          className="border p-2 rounded w-full"
        />
        {errors.number && (
          <p className="text-red-500 text-sm">{errors.number.message}</p>
        )}
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Valider
      </button>
    </form>
  );
}
