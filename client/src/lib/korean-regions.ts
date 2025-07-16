export interface KoreanRegion {
	name: string;
	code: string;
	x: number;
	y: number;
	lat: number;
	lng: number;
	subregions?: string[];
}

export const koreanRegions: KoreanRegion[] = [
	{
		name: "서울특별시",
		code: "11",
		x: 310,
		y: 215,
		lat: 37.5665,
		lng: 126.978,
		subregions: [
			"중구",
			"종로구",
			"용산구",
			"성동구",
			"광진구",
			"동대문구",
			"중랑구",
			"성북구",
			"강북구",
			"도봉구",
			"노원구",
			"은평구",
			"서대문구",
			"마포구",
			"양천구",
			"강서구",
			"구로구",
			"금천구",
			"영등포구",
			"동작구",
			"관악구",
			"서초구",
			"강남구",
			"송파구",
			"강동구",
		],
	},
	{
		name: "부산광역시",
		code: "26",
		x: 475,
		y: 375,
		lat: 35.1796,
		lng: 129.0756,
		subregions: [
			"중구",
			"서구",
			"동구",
			"영도구",
			"부산진구",
			"동래구",
			"남구",
			"북구",
			"해운대구",
			"사하구",
			"금정구",
			"강서구",
			"연제구",
			"수영구",
			"사상구",
			"기장군",
		],
	},
	{
		name: "대구광역시",
		code: "27",
		x: 420,
		y: 315,
		lat: 35.8714,
		lng: 128.6014,
		subregions: [
			"중구",
			"동구",
			"서구",
			"남구",
			"북구",
			"수성구",
			"달서구",
			"달성군",
		],
	},
	{
		name: "인천광역시",
		code: "28",
		x: 260,
		y: 205,
		lat: 37.4563,
		lng: 126.7052,
		subregions: [
			"중구",
			"동구",
			"미추홀구",
			"연수구",
			"남동구",
			"부평구",
			"계양구",
			"서구",
			"강화군",
			"옹진군",
		],
	},
	{
		name: "광주광역시",
		code: "29",
		x: 225,
		y: 340,
		lat: 35.1595,
		lng: 126.8526,
		subregions: ["동구", "서구", "남구", "북구", "광산구"],
	},
	{
		name: "대전광역시",
		code: "30",
		x: 310,
		y: 270,
		lat: 36.3504,
		lng: 127.3845,
		subregions: ["동구", "중구", "서구", "유성구", "대덕구"],
	},
	{
		name: "울산광역시",
		code: "31",
		x: 485,
		y: 330,
		lat: 35.5384,
		lng: 129.3114,
		subregions: ["중구", "남구", "동구", "북구", "울주군"],
	},
	{
		name: "세종특별자치시",
		code: "36",
		x: 285,
		y: 265,
		lat: 36.48,
		lng: 127.289,
		subregions: ["세종시"],
	},
	{
		name: "경기도",
		code: "41",
		x: 290,
		y: 190,
		lat: 37.4138,
		lng: 127.5183,
		subregions: [
			"수원시",
			"성남시",
			"안양시",
			"안산시",
			"용인시",
			"부천시",
			"광명시",
			"평택시",
			"과천시",
			"오산시",
			"시흥시",
			"군포시",
			"의왕시",
			"하남시",
			"김포시",
			"광주시",
			"여주시",
			"화성시",
			"안성시",
			"의정부시",
			"동두천시",
			"고양시",
			"남양주시",
			"파주시",
			"양주시",
			"포천시",
			"연천군",
			"가평군",
			"양평군",
		],
	},
	{
		name: "강원도",
		code: "42",
		x: 420,
		y: 175,
		lat: 37.8228,
		lng: 128.1555,
		subregions: [
			"춘천시",
			"원주시",
			"강릉시",
			"동해시",
			"태백시",
			"속초시",
			"삼척시",
			"홍천군",
			"횡성군",
			"영월군",
			"평창군",
			"정선군",
			"철원군",
			"화천군",
			"양구군",
			"인제군",
			"고성군",
			"양양군",
		],
	},
	{
		name: "충청북도",
		code: "43",
		x: 365,
		y: 255,
		lat: 36.6357,
		lng: 127.4917,
		subregions: [
			"청주시",
			"충주시",
			"제천시",
			"보은군",
			"옥천군",
			"영동군",
			"증평군",
			"진천군",
			"괴산군",
			"음성군",
			"단양군",
		],
	},
	{
		name: "충청남도",
		code: "44",
		x: 245,
		y: 285,
		lat: 36.5184,
		lng: 126.8,
		subregions: [
			"천안시",
			"공주시",
			"보령시",
			"아산시",
			"서산시",
			"논산시",
			"계룡시",
			"당진시",
			"금산군",
			"부여군",
			"서천군",
			"청양군",
			"홍성군",
			"예산군",
			"태안군",
		],
	},
	{
		name: "전라북도",
		code: "45",
		x: 275,
		y: 330,
		lat: 35.7175,
		lng: 127.153,
		subregions: [
			"전주시",
			"군산시",
			"익산시",
			"정읍시",
			"남원시",
			"김제시",
			"완주군",
			"진안군",
			"무주군",
			"장수군",
			"임실군",
			"순창군",
			"고창군",
			"부안군",
		],
	},
	{
		name: "전라남도",
		code: "46",
		x: 225,
		y: 380,
		lat: 34.8679,
		lng: 126.991,
		subregions: [
			"목포시",
			"여수시",
			"순천시",
			"나주시",
			"광양시",
			"담양군",
			"곡성군",
			"구례군",
			"고흥군",
			"보성군",
			"화순군",
			"장흥군",
			"강진군",
			"해남군",
			"영암군",
			"무안군",
			"함평군",
			"영광군",
			"장성군",
			"완도군",
			"진도군",
			"신안군",
		],
	},
	{
		name: "경상북도",
		code: "47",
		x: 425,
		y: 270,
		lat: 36.4919,
		lng: 128.8889,
		subregions: [
			"포항시",
			"경주시",
			"김천시",
			"안동시",
			"구미시",
			"영주시",
			"영천시",
			"상주시",
			"문경시",
			"경산시",
			"군위군",
			"의성군",
			"청송군",
			"영양군",
			"영덕군",
			"청도군",
			"고령군",
			"성주군",
			"칠곡군",
			"예천군",
			"봉화군",
			"울진군",
			"울릉군",
		],
	},
	{
		name: "경상남도",
		code: "48",
		x: 380,
		y: 350,
		lat: 35.4606,
		lng: 128.2132,
		subregions: [
			"창원시",
			"진주시",
			"통영시",
			"사천시",
			"김해시",
			"밀양시",
			"거제시",
			"양산시",
			"의령군",
			"함안군",
			"창녕군",
			"고성군",
			"남해군",
			"하동군",
			"산청군",
			"함양군",
			"거창군",
			"합천군",
		],
	},
	{
		name: "제주특별자치도",
		code: "50",
		x: 200,
		y: 580,
		lat: 33.4996,
		lng: 126.5312,
		subregions: ["제주시", "서귀포시"],
	},
];

export function getRegionFromCoordinates(
	lat: number,
	lng: number
): { name: string; subregion: string } | null {
	// This is a simplified version - in a real implementation, you would use
	// proper geographic boundary checking with polygon data
	const closestRegion = koreanRegions.reduce(
		(closest, region) => {
			const distance = Math.sqrt(
				Math.pow(region.lat - lat, 2) + Math.pow(region.lng - lng, 2)
			);
			return distance < closest.distance ? { region, distance } : closest;
		},
		{ region: koreanRegions[0], distance: Infinity }
	);

	const region = closestRegion.region;
	const subregion = region.subregions?.[0] || "중구";

	return { name: region.name, subregion };
}

export async function getRegionFromCoordinatesAsync(
	lat: number,
	lng: number
): Promise<{ name: string; subregion: string } | null> {
	try {
		const res = await fetch(
			`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ko&zoom=16&addressdetails=1`
		);
		const data = await res.json();
		const addr = data.address || {};
		const regionName = addr.city || addr.county || addr.state;
		const subName =
			addr.city_district ||
			addr.district ||
			addr.borough ||
			addr.suburb ||
			addr.quarter ||
			"";

		if (!regionName) return null;
		return { name: regionName, subregion: subName };
	} catch {
		return null;
	}
}
