// Editorial scenery only; never supplied to summon RNG, costs or pool selection.
const SUMMON_SCENES = [
 {key:'hoi-tu',title:'Linh hồn hội tụ',eyebrow:'MỘNG PHỐ',ids:['linh_dong','bach_dien','thay_mo']},
 {key:'net-mong',title:'Đèn soi Mộng Giới',eyebrow:'ẢNH ĐĂNG',ids:['luc_anh','dinh_loi','ong_hang_pho']},
 {key:'phong-van',title:'Gió nổi tầng không',eyebrow:'PHONG VÂN',ids:['tieu_phong','ky_van','luc_anh']}
];
export function summonShowcase(index, catalog, roster, posters) {
 const n=Number.isFinite(index)?Math.trunc(index):0;
 const selected=((n%SUMMON_SCENES.length)+SUMMON_SCENES.length)%SUMMON_SCENES.length;
 const scene=SUMMON_SCENES[selected],allowed=new Set(roster);
 return {...scene,index:selected,count:SUMMON_SCENES.length,heroes:scene.ids.filter(id=>allowed.has(id)&&catalog[id]&&posters[id]).map(id=>({id,name:catalog[id].name,src:posters[id]}))};
}
