"use client";

import { FC } from "react";

import { useRouter } from "next/navigation";
import { classNames } from "../utils/classnames";
import { Spinner } from "./Spinner";

export const Step: FC<{
  children: any;
  onNext: () => void;
  onNextLabel: string;
  onNextDisabled: boolean;
  loading?: boolean;
  backDisabled?: boolean;
}> = ({
  onNext,
  onNextLabel,
  children,
  onNextDisabled,
  loading,
  backDisabled,
}) => {
  const router = useRouter();

  const disabled = onNextDisabled || loading;
  return (
    <div className="space-y-10 divide-y divide-gray-900/10 w-full">
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
        <div className="px-4 py-6 sm:p-8">{children}</div>
        <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
          {backDisabled ? null : (
            <button
              type="button"
              onClick={router.back}
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              Back
            </button>
          )}
          <button
            className={classNames(
              `rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition flex items-center space-x-2`,
              !disabled && "bg-indigo-600 hover:bg-indigo-500",
              disabled && "bg-indigo-400"
            )}
            disabled={disabled}
            onClick={onNext}
          >
            <span>{onNextLabel}</span>
            {loading && <Spinner />}
          </button>
        </div>
      </div>
    </div>
  );
};
