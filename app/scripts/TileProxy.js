import slugid from 'slugid';
import path from 'path'


class TileProxy  {
    constructor() {
        this.uid = slugid.nice();
    }

    trackInfo(server, tilesetUid) {
        console.log('server:', server);
       let outUrl = path.join(server, 'tilesets') 

    }
}

export let tileProxy = new TileProxy();
