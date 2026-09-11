const BOXES:Record<string,{viewBox:string;width:number;height:number}>={
 '/niyamah/order/prod-1.png':{viewBox:'33 94 1051 1259',width:1122,height:1402},
 '/niyamah/order/prod-2.png':{viewBox:'306 13 698 996',width:1328,height:1184},
 '/niyamah/order/prod-3.png':{viewBox:'218 0 692 1148',width:1080,height:1360}
};
// Crop transparent padding in the viewport, leaving the source photograph unchanged.
export function OrderImage({src,alt=''}:{src:string;alt?:string}){const box=BOXES[src];return box?<svg className="no-art" viewBox={box.viewBox} preserveAspectRatio="xMidYMax meet" role={alt?'img':undefined} aria-label={alt||undefined} aria-hidden={alt?undefined:true}><image href={src} width={box.width} height={box.height}/></svg>:<img className="no-art" src={src} alt={alt} onError={e=>{if(!e.currentTarget.src.endsWith('placeholder.svg'))e.currentTarget.src='/niyamah/order/placeholder.svg';}}/>;}
