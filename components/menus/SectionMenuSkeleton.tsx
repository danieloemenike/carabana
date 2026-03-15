"use client";

export function SectionMenuSkeleton() {
  return (
    <section className="mt-4 flex h-full w-full py-10">
      <div className="h-full w-full">
        <div className="flex h-full w-full items-center justify-center px-2 text-[1rem] md:text-[3rem]">
          <div className="h-10 w-64 animate-pulse rounded-lg bg-white/10 md:h-14 md:w-96" />
        </div>
        <div className="h-full w-full">
          <div className="m-4 flex flex-col justify-center gap-2 p-4 md:flex-row md:gap-4">
            <div className="mt-4 h-10 w-32 animate-pulse rounded-md bg-white/10" />
            <div className="mt-4 h-10 w-full animate-pulse rounded-md bg-white/10 lg:w-[40%]" />
          </div>

          {[1, 2].map((categoryIndex) => (
            <div key={categoryIndex} className="mb-16">
              <div className="flex justify-center">
                <div className="mb-12 h-9 w-48 animate-pulse rounded-lg bg-white/10" />
              </div>
              <div className="mx-2 grid grid-cols-2 gap-2 md:mx-3 md:grid-cols-3 md:gap-6 lg:mx-20 lg:grid-cols-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((itemIndex) => (
                  <div
                    key={itemIndex}
                    className="h-80 w-50 rounded-md p-2 shadow backdrop-blur-lg"
                  >
                    <div className="mb-2 flex h-60 w-full animate-pulse items-center justify-center overflow-hidden rounded-t-lg bg-white/10" />
                    <div className="mb-4 flex h-[17%] w-full items-center justify-center rounded-xl border border-white/10 px-3 py-8">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
