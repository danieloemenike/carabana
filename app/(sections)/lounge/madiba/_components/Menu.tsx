import { SectionMenu } from "@/components/menus/SectionMenu";

export default function Menu() {
  return (
    <SectionMenu
      endpoint="/api/menus/lounge/madiba"
      heading="Madiba Lounge Menu"
      titleClassName="font-bold text-[2rem] lg:text-[4rem] font-gv bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-white to-white"
      categoryHeadingClassName="font-bold text-[3rem] text-center mt-32 mb-12 font-gv capitalize tracking-[.20rem] bg-clip-text text-transparent bg-gradient-to-r to-white from-rose-400"
      emptyLabel="No drinks found"
    />
  );
}
