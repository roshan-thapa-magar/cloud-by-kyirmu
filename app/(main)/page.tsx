import BannerSlider from "@/components/BannerSlider";
import BestSellingItems from "@/components/MainPage/BestSellingItems";
import Categories from "@/components/MainPage/Categories";
import ComboMeal from "@/components/MainPage/ComboMeal";
import PopularItems from "@/components/MainPage/PolularItems";

export default function Page() {
  return <div>
    <BannerSlider />
    <Categories/>
    <ComboMeal/>
    <BestSellingItems/>
    {/* <PopularItems/> */}
  </div>;
}
