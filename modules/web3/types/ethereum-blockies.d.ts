// ethereum-blockies 未附带类型声明，描述本模块使用的公开 Canvas 生成接口。
declare module "ethereum-blockies" {
  interface BlockiesOptions {
    seed?: string;
    size?: number;
    scale?: number;
    color?: string;
    bgcolor?: string;
    spotcolor?: string;
  }
  const blockies: {
    create(options?: BlockiesOptions): HTMLCanvasElement;
  };
  export default blockies;
}
