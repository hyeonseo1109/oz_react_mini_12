import { useEffect, useMemo } from "react";
import { useMovieStore, useMode, usePage } from "../store/movieStore"
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Scrollbar } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/scrollbar';
import { useDebounce } from "../useDebounce";
import { useSearchParams } from "react-router-dom";
import { useSupabase } from "../supabase/context";

export function MovieCard () {
    const movies = useMovieStore( state => state.movies );
    const fetchMovies = useMovieStore( state => state.fetchMovies);

    const sortMode = useMode(state => state.sortMode);
    const setSortMode = useMode(state => state.setSortMode);

    const page = usePage(state => state.page);
    const setPage = usePage(state => state.setPage);

    const searchedResults = useMovieStore(state => state.searchedResults);
    const fetchSearchedResults = useMovieStore(state => state.fetchSearchedResults);
    // 원래는 검색창 입력했을 때, 입력값 디바운스 씌우고 파람스로 입력값을 보내서 제목으로 결과를 찾았었는데
    // 이제 전역상태로 입력값을 관리하면서 디바운스된 입력값을 상태값에 저장하고 
    // 디바운스에 인자로 전역상태인 입력값을 넣고 
    // 결과 불러오는 fetchSearchedResults에서 검색하는 용도의 api 주소에 그 디바운스를 넣어서
    // 검색입력값이 있으면 저 fetchSearchedResults를 통해서 검색결과를 받아오고
    // 검색입력값이 없으면 그냥 fetchMovies에서 popular 영화 120개 보여주는 거.
    
    const moviePage = 20;

    
    const [searchParams] = useSearchParams();
    const query = searchParams.get("query") || '';
    const debounceQuery = useDebounce(query);

    useEffect(() => {
        if (debounceQuery) {
            fetchSearchedResults(debounceQuery);
            setPage(1);
        } else {
            fetchMovies();
        }
    }, [debounceQuery, fetchMovies, fetchSearchedResults, setPage]);

    const activeMovies = debounceQuery ? searchedResults : movies;
    


    const sortedMovies = useMemo(() => {
        const sorted = [...activeMovies];

        if (sortMode === 'vote') {
        sorted.sort((a,b) => b.vote_average - a.vote_average);
        } else if (sortMode === 'recent') {
        sorted.sort((a,b) => new Date(b.release_date) - new Date(a.release_date));
        } else if (sortMode === 'popular') {
        sorted.sort((a,b) => b.popularity - a.popularity);
        }
        return sorted;
    }, [activeMovies, sortMode]);


    const pagedMovies = useMemo(() => {
        const startIndex = (page - 1) * moviePage;
        return sortedMovies.slice(startIndex, startIndex + moviePage);
    }, [sortedMovies, page]);
    //     만약 페이지가 4라면, 페이지당 20개씩 보여주니까 총 48개가 나와야 함.
    // 그러니까 (4-1) *20 = 60, 그래서 slice로 인덱스 60번부터 60+12번 만큼만 보여주는 거.

    const imgUrl = "https://image.tmdb.org/t/p/w500";

    const {isDark} = useSupabase();
    

    return (
    <div  className={`${isDark ? "background" : "light-background"}`}>
            

        <div className="flex m-0 p-5 gap-5">
            <span
                onClick={() => setSortMode('vote')}
                className={`px-3 rounded-[0.4em] select-none cursor-pointer hover:bg-gray-700
                ${sortMode === 'vote' ? 'bg-[#ccc] text-black': 'bg-[#454545b9] text-white '}
                `}
            >별점순</span>
            <span
                onClick={() => setSortMode('recent')}
                className={`px-3 rounded-[0.4em] select-none cursor-pointer hover:bg-gray-700
                ${sortMode === 'recent' ? 'bg-[#ccc] text-black': 'bg-[#454545b9] text-white '}
                `}
            >최신순</span>
            <span 
                onClick={() => setSortMode('popular')}
                className={`px-3 rounded-[0.4em] select-none cursor-pointer hover:bg-gray-700
                ${sortMode === 'popular' ? 'bg-[#ccc] text-black': 'bg-[#454545b9] text-white '}
                `}
            >인기순</span>
        </div>
        

        { !debounceQuery && (
                <Swiper
                    modules={[Navigation, Scrollbar, Autoplay]}
                    navigation
                    scrollbar={{ draggable: true }}
                    centeredSlides={true}
                    grabCursor={true}
                    autoplay={{
                        delay: 2000,
                        disableOnInteraction: false,
                    }}
                    // loop={true} 
                    breakpoints={{
                        0: { slidesPerView: 1, spaceBetween: 20 },
                        700: { slidesPerView: 2, spaceBetween: 30 },
                        900: { slidesPerView: 3, spaceBetween: 40 },
                        1200: { slidesPerView: 4, spaceBetween: 100 },
                        1500: { slidesPerView: 5, spaceBetween: 400 },
                    }}
                    style={{ display: 'flex', justifyContent: 'center' }} 
                >
                    {sortedMovies.slice(0, 5).map((mv) => (
                        <SwiperSlide key={mv.id} className="w-full flex justify-center items-center">
                            <Link to={`/detail/${mv.id}`}>
                                <div className={`w-[10em] h-[15em] relative overflow-hidden flex mx-auto rounded-[0.8em] m-10 ${isDark ? "shadow-[0_0_30px_black]" : "shadow-[0_0_30px_rgb(152,152,152)]"}`}>
                                    <img src={`${imgUrl}${mv.poster_path}`} />
                                    <div className="bg-[#000000c1] text-white absolute w-full h-[3em] bottom-[0.5em] shadow-[0_-0.3em_0.3em_rgba(255,255,255,0.3),_0_0.3em_0.3em_rgba(255,255,255,0.3)] flex flex-col justify-center">
                                        <p className="text-[20px] leading-[1] flex justify-center text-center break-keep">{mv.title}</p>
                                        <div className="flex flex-row justify-end items-end ">
                                            <p className="text-[0.65em] flex justify-end mx-2 ">★{mv.vote_average}</p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </SwiperSlide>
                    ))}
                </Swiper>

        )}
        <div className="flex flex-wrap gap-6 p-4 justify-center my-5">
            {activeMovies.length !== 0 ? pagedMovies.map( (mv, idx) => (
                <Link
                    to={`/detail/${mv.id}`}
                    key={`${mv.id}-${idx}`} 
                    className="border bg-black shadow-[0_0_15px_#000000c1] box rounded-[0.8em]">
                    <div className="w-[10em] h-[15em] relative overflow-hidden flex rounded-[0.8em]">
                        <img src={`${imgUrl}${mv.poster_path}`} />
                        <div className="bg-[#000000c1] text-white absolute w-full h-[3em] bottom-[0.5em] shadow-[0_-0.3em_0.3em_rgba(255,255,255,0.3),_0_0.3em_0.3em_rgba(255,255,255,0.3)] flex flex-col justify-center">
                            <p className="text-[20px] leading-[1] flex justify-center text-center break-keep">{mv.title}</p>
                            <div className="flex flex-row justify-end items-end ">
                                <p className="text-[0.65em] flex justify-end mx-2 ">★{mv.vote_average}</p>
                            </div>
                        </div>
                    </div>
                </Link>  
                    
            // )) : ( <div className="text-center text-white text-lg">검색 결과가 없습니다.</div>)}
            )) : ( <div className={`${isDark ? "background text-white" : "bg-white text-black"} text-center  text-lg w-full flex justify-center min-h-screen `}>로딩 중...</div>)}

        </div>
        <div className="flex justify-center gap-4 py-[2em_10em]">
            {[1,2,3,4,5,6,7,8,9,10].map((num) => (
            <button
                key={num}
                onClick={() => setPage(num)}
                className={`
                    flex justify-center items-center rounded 
                    h-6 w-6 text-sm
                    ${num === page 
                    ? "bg-blue-900 text-white font-bold" 
                    : "bg-white text-black"} 
                    hover:bg-gray-700 hover:text-white
                `}
                >
                {num}
                </button>
                ))}
        </div>
    </div>
    )
}
