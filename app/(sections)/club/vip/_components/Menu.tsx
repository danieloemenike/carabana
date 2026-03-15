import { SectionMenu } from "@/components/menus/SectionMenu";

export default function Menu() {
  return (
    <SectionMenu
      endpoint="/api/menus/club/vip"
      heading="Vip Menu"
      titleClassName="font-bold text-[2rem] lg:text-[4rem] font-gv bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-white to-rose-500"
      categoryHeadingClassName="font-bold text-[3rem] text-center mt-32 mb-12 font-gv capitalize tracking-[.20rem] bg-clip-text text-transparent bg-gradient-to-r from-rose-600 via-white to-rose-600"
      emptyLabel="No drinks found"
    />
  );
}
