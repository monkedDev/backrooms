/**
 * The Backrooms - Фиксированный уровень
 * Разные комнаты, коридоры, пути - без генерации
 */

export class LevelGenerator {
    constructor(config, THREE) {
        this.config = config;
        this.THREE = THREE;
        this.rooms = [];
        this.wallColliders = [];
    }

    // Создание стандартной комнаты
    createRoom(materials, x, z, scene, roomType = 'empty') {
        const T = this.THREE;
        const w = this.config.roomWidth;
        const h = this.config.roomHeight;
        const d = this.config.roomDepth;
        const wallThickness = 0.3;

        const roomGroup = new T.Group();
        const worldX = x * w;
        const worldZ = z * d;

        // Пол
        const floor = new T.Mesh(new T.PlaneGeometry(w, d), materials.carpet);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        roomGroup.add(floor);

        // Потолок
        const ceiling = new T.Mesh(new T.PlaneGeometry(w, d), materials.ceiling);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = h;
        roomGroup.add(ceiling);

        // Стены
        const wallMat = materials.wallpaper;

        const frontWall = new T.Mesh(new T.BoxGeometry(w, h, wallThickness), wallMat);
        frontWall.position.set(0, h / 2, -d / 2);
        roomGroup.add(frontWall);

        const backWall = new T.Mesh(new T.BoxGeometry(w, h, wallThickness), wallMat);
        backWall.position.set(0, h / 2, d / 2);
        roomGroup.add(backWall);

        const leftWall = new T.Mesh(new T.BoxGeometry(wallThickness, h, d), wallMat);
        leftWall.position.set(-w / 2, h / 2, 0);
        roomGroup.add(leftWall);

        const rightWall = new T.Mesh(new T.BoxGeometry(wallThickness, h, d), wallMat);
        rightWall.position.set(w / 2, h / 2, 0);
        roomGroup.add(rightWall);

        roomGroup.position.set(worldX, 0, worldZ);
        scene.add(roomGroup);
        this.rooms.push(roomGroup);

        // Коллизии
        this.addWallColliders(worldX, worldZ, w, d, h, wallThickness);

        // Добавляем объекты по типу комнаты
        this.addRoomObjects(roomGroup, roomType, w, h, d, worldX, worldZ);

        return roomGroup;
    }

    // Добавление коллизий
    addWallColliders(worldX, worldZ, w, d, h, wt) {
        const hw = w / 2;
        const hd = d / 2;

        this.wallColliders.push(
            { minX: worldX - hw, maxX: worldX + hw, minZ: worldZ - hd - wt, maxZ: worldZ - hd + wt, minY: 0, maxY: h },
            { minX: worldX - hw, maxX: worldX + hw, minZ: worldZ + hd - wt, maxZ: worldZ + hd + wt, minY: 0, maxY: h },
            { minX: worldX - hw - wt, maxX: worldX - hw + wt, minZ: worldZ - hd, maxZ: worldZ + hd, minY: 0, maxY: h },
            { minX: worldX + hw - wt, maxX: worldX + hw + wt, minZ: worldZ - hd, maxZ: worldZ + hd, minY: 0, maxY: h }
        );
    }

    // Объекты в комнате
    addRoomObjects(roomGroup, roomType, w, h, d, worldX, worldZ) {
        const T = this.THREE;

        if (roomType === 'pillars') {
            // Комната с 4 колоннами
            const pillarGeo = new T.BoxGeometry(0.6, h, 0.6);
            const pillarMat = new T.MeshStandardMaterial({ color: 0x999999, roughness: 0.9 });
            const positions = [[-2, h/2, -2], [2, h/2, -2], [-2, h/2, 2], [2, h/2, 2]];
            positions.forEach(pos => {
                const pillar = new T.Mesh(pillarGeo, pillarMat);
                pillar.position.set(...pos);
                roomGroup.add(pillar);
                this.wallColliders.push({
                    minX: worldX + pos[0] - 0.35, maxX: worldX + pos[0] + 0.35,
                    minZ: worldZ + pos[2] - 0.35, maxZ: worldZ + pos[2] + 0.35,
                    minY: 0, maxY: h
                });
            });
        } else if (roomType === 'boxes') {
            // Комната с ящиками
            const boxGeo = new T.BoxGeometry(1.2, 1.2, 1.2);
            const boxMat = new T.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });
            const positions = [[-2.5, 0.6, -2], [2.5, 0.6, -2], [-2.5, 0.6, 2], [0, 0.6, 0]];
            positions.forEach((pos, i) => {
                if (i < 3) {
                    const box = new T.Mesh(boxGeo, boxMat);
                    box.position.set(...pos);
                    roomGroup.add(box);
                    this.wallColliders.push({
                        minX: worldX + pos[0] - 0.6, maxX: worldX + pos[0] + 0.6,
                        minZ: worldZ + pos[2] - 0.6, maxZ: worldZ + pos[2] + 0.6,
                        minY: 0, maxY: 1.2
                    });
                }
            });
        } else if (roomType === 'table') {
            // Комната со столом
            const tableTop = new T.Mesh(new T.BoxGeometry(2, 0.1, 1), new T.MeshStandardMaterial({ color: 0x654321 }));
            tableTop.position.set(0, 1, 0);
            roomGroup.add(tableTop);
            const legGeo = new T.CylinderGeometry(0.05, 0.05, 1);
            [[-0.8, 0.5, -0.3], [0.8, 0.5, -0.3], [-0.8, 0.5, 0.3], [0.8, 0.5, 0.3]].forEach(pos => {
                const leg = new T.Mesh(legGeo, new T.MeshStandardMaterial({ color: 0x444444 }));
                leg.position.set(...pos);
                roomGroup.add(leg);
            });
        } else if (roomType === 'lights') {
            // Комната с множеством ламп
            for (let i = 0; i < 4; i++) {
                const lightGeo = new T.BoxGeometry(0.4, 0.1, 0.4);
                const lightMat = new T.MeshBasicMaterial({ color: 0xffaa00 });
                const light = new T.Mesh(lightGeo, lightMat);
                light.position.set((i % 2 - 0.5) * 3, h - 0.1, (Math.floor(i / 2) - 0.5) * 3);
                roomGroup.add(light);
                const pointLight = new T.PointLight(0xffaa00, 1, 10);
                pointLight.position.copy(light.position);
                roomGroup.add(pointLight);
            }
        }

        // Лампа на потолке (есть везде)
        if (roomType !== 'lights') {
            const lightGeo = new T.BoxGeometry(0.3, 0.1, 0.3);
            const lightMat = new T.MeshBasicMaterial({ color: 0xffaa00 });
            const light = new T.Mesh(lightGeo, lightMat);
            light.position.set(0, h - 0.1, 0);
            roomGroup.add(light);
            const pointLight = new T.PointLight(0xffaa00, 1, 12);
            pointLight.position.copy(light.position);
            roomGroup.add(pointLight);
        }
    }

    // Создание коридора
    createCorridor(materials, x1, z1, x2, z2, scene, length = 1) {
        const T = this.THREE;
        const corridorGroup = new T.Group();
        const h = this.config.roomHeight;
        const wallThickness = 0.3;
        const corridorW = this.config.corridorWidth;
        const corridorD = length * this.config.roomWidth;
        const worldX = ((x1 + x2) / 2) * this.config.roomWidth;
        const worldZ = ((z1 + z2) / 2) * this.config.roomDepth;

        const floor = new T.Mesh(new T.PlaneGeometry(corridorW, corridorD), materials.carpet);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        corridorGroup.add(floor);

        const ceiling = new T.Mesh(new T.PlaneGeometry(corridorW, corridorD), materials.ceiling);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = h;
        corridorGroup.add(ceiling);

        const sideWall1 = new T.Mesh(new T.BoxGeometry(wallThickness, h, corridorD), materials.wallpaper);
        sideWall1.position.set(-corridorW / 2, h / 2, 0);
        corridorGroup.add(sideWall1);

        const sideWall2 = new T.Mesh(new T.BoxGeometry(wallThickness, h, corridorD), materials.wallpaper);
        sideWall2.position.set(corridorW / 2, h / 2, 0);
        corridorGroup.add(sideWall2);

        corridorGroup.position.set(worldX, 0, worldZ);
        if (x1 === x2) corridorGroup.rotation.y = Math.PI / 2;

        scene.add(corridorGroup);

        // Коллизии коридора
        const cw = corridorW / 2;
        const cd = corridorD / 2;
        const wt = wallThickness / 2;
        this.wallColliders.push(
            { minX: worldX - cw - wt, maxX: worldX - cw + wt, minZ: worldZ - cd, maxZ: worldZ + cd, minY: 0, maxY: h },
            { minX: worldX + cw - wt, maxX: worldX + cw + wt, minZ: worldZ - cd, maxZ: worldZ + cd, minY: 0, maxY: h }
        );

        // Лампы в коридоре
        for (let i = 0; i < length; i++) {
            const lightGeo = new T.BoxGeometry(0.2, 0.05, 0.2);
            const lightMat = new T.MeshBasicMaterial({ color: 0xffaa00 });
            const light = new T.Mesh(lightGeo, lightMat);
            light.position.set(0, h - 0.1, -corridorD/2 + (i + 0.5) * (corridorD / length));
            corridorGroup.add(light);
            const pointLight = new T.PointLight(0xffaa00, 0.7, 8);
            pointLight.position.copy(light.position);
            corridorGroup.add(pointLight);
        }
    }

    // Создание широкого коридора (путь)
    createWideCorridor(materials, x1, z1, x2, z2, scene, width = 2) {
        const T = this.THREE;
        const corridorGroup = new T.Group();
        const h = this.config.roomHeight;
        const wallThickness = 0.3;
        const corridorW = width * this.config.corridorWidth;
        const corridorD = this.config.roomWidth;
        const worldX = ((x1 + x2) / 2) * this.config.roomWidth;
        const worldZ = ((z1 + z2) / 2) * this.config.roomDepth;

        const floor = new T.Mesh(new T.PlaneGeometry(corridorW, corridorD), materials.carpet);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        corridorGroup.add(floor);

        const ceiling = new T.Mesh(new T.PlaneGeometry(corridorW, corridorD), materials.ceiling);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = h;
        corridorGroup.add(ceiling);

        const sideWall1 = new T.Mesh(new T.BoxGeometry(wallThickness, h, corridorD), materials.wallpaper);
        sideWall1.position.set(-corridorW / 2, h / 2, 0);
        corridorGroup.add(sideWall1);

        const sideWall2 = new T.Mesh(new T.BoxGeometry(wallThickness, h, corridorD), materials.wallpaper);
        sideWall2.position.set(corridorW / 2, h / 2, 0);
        corridorGroup.add(sideWall2);

        corridorGroup.position.set(worldX, 0, worldZ);
        if (x1 === x2) corridorGroup.rotation.y = Math.PI / 2;

        scene.add(corridorGroup);

        const cw = corridorW / 2;
        const cd = corridorD / 2;
        const wt = wallThickness / 2;
        this.wallColliders.push(
            { minX: worldX - cw - wt, maxX: worldX - cw + wt, minZ: worldZ - cd, maxZ: worldZ + cd, minY: 0, maxY: h },
            { minX: worldX + cw - wt, maxX: worldX + cw + wt, minZ: worldZ - cd, maxZ: worldZ + cd, minY: 0, maxY: h }
        );

        // Лампы
        const lightGeo = new T.BoxGeometry(0.3, 0.1, 0.3);
        const lightMat = new T.MeshBasicMaterial({ color: 0xffaa00 });
        const light = new T.Mesh(lightGeo, lightMat);
        light.position.set(0, h - 0.1, 0);
        corridorGroup.add(light);
        const pointLight = new T.PointLight(0xffaa00, 1, 15);
        pointLight.position.copy(light.position);
        corridorGroup.add(pointLight);
    }

    // ФИКСИРОВАННЫЙ УРОВЕНЬ
    generateLevel(materials, scene) {
        this.rooms = [];
        this.wallColliders = [];

        // Стартовая комната (центр)
        this.createRoom(materials, 0, 0, scene, 'lights');

        // Северные комнаты
        this.createRoom(materials, 0, -1, scene, 'empty');
        this.createRoom(materials, 0, -2, scene, 'pillars');
        this.createRoom(materials, -1, -2, scene, 'boxes');
        this.createRoom(materials, 1, -2, scene, 'table');

        // Южные комнаты
        this.createRoom(materials, 0, 1, scene, 'empty');
        this.createRoom(materials, 0, 2, scene, 'boxes');
        this.createRoom(materials, -1, 2, scene, 'pillars');
        this.createRoom(materials, 1, 2, scene, 'empty');

        // Западные комнаты
        this.createRoom(materials, -1, 0, scene, 'table');
        this.createRoom(materials, -2, 0, scene, 'pillars');
        this.createRoom(materials, -2, -1, scene, 'boxes');
        this.createRoom(materials, -2, 1, scene, 'empty');

        // Восточные комнаты
        this.createRoom(materials, 1, 0, scene, 'empty');
        this.createRoom(materials, 2, 0, scene, 'lights');
        this.createRoom(materials, 2, -1, scene, 'table');
        this.createRoom(materials, 2, 1, scene, 'boxes');

        // Угловые комнаты
        this.createRoom(materials, -3, -2, scene, 'pillars');
        this.createRoom(materials, 3, -2, scene, 'boxes');
        this.createRoom(materials, -3, 2, scene, 'table');
        this.createRoom(materials, 3, 2, scene, 'empty');

        // Коридоры - север
        this.createCorridor(materials, 0, 0, 0, -1, scene);
        this.createCorridor(materials, 0, -1, 0, -2, scene);
        this.createCorridor(materials, 0, -2, -1, -2, scene);
        this.createCorridor(materials, 0, -2, 1, -2, scene);

        // Коридоры - юг
        this.createCorridor(materials, 0, 0, 0, 1, scene);
        this.createCorridor(materials, 0, 1, 0, 2, scene);
        this.createCorridor(materials, 0, 2, -1, 2, scene);
        this.createCorridor(materials, 0, 2, 1, 2, scene);

        // Коридоры - запад
        this.createCorridor(materials, 0, 0, -1, 0, scene);
        this.createCorridor(materials, -1, 0, -2, 0, scene);
        this.createCorridor(materials, -2, 0, -2, -1, scene);
        this.createCorridor(materials, -2, 0, -2, 1, scene);

        // Коридоры - восток
        this.createCorridor(materials, 0, 0, 1, 0, scene);
        this.createCorridor(materials, 1, 0, 2, 0, scene);
        this.createCorridor(materials, 2, 0, 2, -1, scene);
        this.createCorridor(materials, 2, 0, 2, 1, scene);

        // Широкие коридоры (главные пути)
        this.createWideCorridor(materials, -1, -1, 1, -1, scene, 2.5);
        this.createWideCorridor(materials, -1, 1, 1, 1, scene, 2.5);

        return this.rooms;
    }

    getWallColliders() {
        return this.wallColliders;
    }
}
