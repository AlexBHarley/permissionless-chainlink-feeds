import { CheckCircleIcon } from "@heroicons/react/20/solid";
import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { FC } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { classNames } from "../utils/classnames";

const STEPS = [
  { route: "/", label: "Welcome", address: false },
  { route: "/deploy", label: "Deploy", address: false },
  { route: "/{address}/initialise", label: "Initialise", address: true },
  { route: "/{address}/trigger", label: "Trigger", address: true },
  { route: "/{address}/automate", label: "Automate", address: true },
  { route: "/{address}/done", label: "Done", address: true },
];

type Status = "done" | "doing" | "not-done";

export const Navigation: FC<{ children: any }> = ({ children }) => {
  const pathname = usePathname();
  const { address } = useAccount();
  const params = useParams();

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <div className="flex justify-end">
        {!address ? (
          <div className="flex items-center justify-center">
            <ConnectButton />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <ConnectButton />
            </div>
          </div>
        )}
      </div>
      <div className="flex space-x-12">
        <nav className="flex justify-center" aria-label="Progress">
          <ol role="list" className="space-y-6">
            {STEPS.map((step, index) => {
              const currentStepIndex = STEPS.findIndex((x) =>
                pathname === "/"
                  ? x.label === "Welcome"
                  : pathname?.includes(x.label.toLowerCase())
              );

              const address = (params as any).address;
              const link = step.route.replace("{address}", address);

              const linkDisabled = step.route.includes("{address}") && !address;

              const status: Status =
                currentStepIndex === index
                  ? "doing"
                  : currentStepIndex < index
                  ? "not-done"
                  : "done";
              return (
                <li key={step.label}>
                  {status === "done" ? (
                    <Link
                      href={link}
                      className="flex items-start"
                      aria-current="step"
                      prefetch={false}
                    >
                      <span className="flex items-start">
                        <span className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center">
                          <CheckCircleIcon
                            className="h-full w-full text-indigo-600 group-hover:text-indigo-800"
                            aria-hidden="true"
                          />
                        </span>
                        <span className="ml-3 text-sm font-medium text-gray-500 group-hover:text-gray-900">
                          {step.label}
                        </span>
                      </span>
                    </Link>
                  ) : status === "doing" ? (
                    <Link
                      href={link}
                      className="flex items-start"
                      aria-current="step"
                      prefetch={false}
                    >
                      <span
                        className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center"
                        aria-hidden="true"
                      >
                        <span className="absolute h-4 w-4 rounded-full bg-indigo-200" />
                        <span className="relative block h-2 w-2 rounded-full bg-indigo-600" />
                      </span>
                      <span className="ml-3 text-sm font-medium text-indigo-600">
                        {step.label}
                      </span>
                    </Link>
                  ) : (
                    <Link
                      href={link}
                      className={classNames(
                        `flex items-start`,
                        linkDisabled && "pointer-events-none"
                      )}
                      aria-current="step"
                      prefetch={false}
                      aria-disabled={linkDisabled}
                    >
                      <div className="flex items-start">
                        <div
                          className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center"
                          aria-hidden="true"
                        >
                          <div className="h-2 w-2 rounded-full bg-gray-300 group-hover:bg-gray-400" />
                        </div>
                        <p className="ml-3 text-sm font-medium text-gray-500 group-hover:text-gray-900">
                          {step.label}
                        </p>
                      </div>
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {children}
      </div>
    </div>
  );
};
