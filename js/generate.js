/**
 * The Backrooms - Procedural Level Generator v2
 * С разнообразными комнатами и объектами
 */

export class LevelGenerator {
    constructor(config, THREE) {
        this.config = config;
        this.THREE = THREE;
        this.grid = [];
        this.rooms = [];
        this.wallColliders = []; // Упрощённые коллизии
    }

    initGrid(size) {
        this.grid = [];
        for (let x = 0; x < size; x++) {
            this.grid[x] = [];
            for (let z = 0; z < size; z++) {
                this.grid[x][z] = 0;
            }
        }
    }

    isValid(x, z, size) {
        return x >= 0 && z >= 0 && x < size && z < size;
    }

    getUnvisitedNeighbors(x, z, size) {
        const neighbors = [];
        const directions = [
            { dx: 0, dz: -2 },
            { dx: 0, dz: 2 },
            { dx: -2, dz: 0 },
            { dx: 2, dz: 0 }
        ];

        for (const dir of directions) {
            const nx = x + dir.dx;
            const nz = z + dir.dz;
            if (this.isValid(nx, nz, size) && this.grid[nx][nz] === 0) {
                neighbors.push({ x: nx, z: nz, dx: dir.dx / 2, dz: dir.dz / 2 });
            }
        }
        return neighbors;
    }

    generateMaze(size) {
        this.initGrid(size);
        const startX = Math.floor(size / 2);
        const startZ = Math.floor(size / 2);
        const stack = [{ x: startX, z: startZ }];
        this.grid[startX][startZ] = 1;

        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = this.getUnvisitedNeighbors(current.x, current.z, size);

            if (neighbors.length === 0) {
                stack.pop();
            } else {
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                this.grid[next.x][next.z] = 1;
                this.grid[current.x + next.dx][current.z + next.dz] = 1;
                stack.push({ x: next.x, z: next.z });
            }
        }

        // Меньше случайных комнат
        for (let x = 0; x < size; x++) {
            for (let z = 0; z < size; z++) {
                if (this.grid[x][z] === 0 && Math.random() < 0.1) {
                    const hasNeighbor =
                        (this.isValid(x - 1, z, size) && this.grid[x - 1][z] === 1) ||
                        (this.isValid(x + 1, z, size) && this.grid[x + 1][z] === 1) ||
                        (this.isValid(x, z - 1, size) && this.grid[x][z - 1] === 1) ||
                        (this.isValid(x, z + 1, size) && this.grid[x][z + 1] === 1);
                    if (hasNeighbor) this.grid[x][z] = 1;
                }
            }
        }
    }

    // Упрощённое создание комнаты с коллизиями
    createRoom(materials, x, z, scene, roomType = 0) {
        const T = this.THREE;
        const w = this.config.roomWidth;
        const h = this.config.roomHeight;
        const d = this.config.roomDepth;
        const wallThickness = 0.3;

        const roomGroup = new T.Group();
        const worldX = x * w;
        const worldZ = z * d;

        // Пол
        const floor = new T.Mesh(
            new T.PlaneGeometry(w, d),
            materials.carpet
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        roomGroup.add(floor);

        // Потолок
        const ceiling = new T.Mesh(
            new T.PlaneGeometry(w, d),
            materials.ceiling
        );
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = h;
        roomGroup.add(ceiling);

        // Стены с разными текстурами для разнообразия
        const wallMat = roomType === 1 ? materials.wallpaper2 || materials.wallpaper : materials.wallpaper;

        // Передняя стена
        const frontWall = new T.Mesh(
            new T.BoxGeometry(w, h, wallThickness),
            wallMat
        );
        frontWall.position.set(0, h / 2, -d / 2);
        roomGroup.add(frontWall);

        // Задняя стена
        const backWall = new T.Mesh(
            new T.BoxGeometry(w, h, wallThickness),
            wallMat
        );
        backWall.position.set(0, h / 2, d / 2);
        roomGroup.add(backWall);

        // Левая стена
        const leftWall = new T.Mesh(
            new T.BoxGeometry(wallThickness, h, d),
            wallMat
        );
        leftWall.position.set(-w / 2, h / 2, 0);
        roomGroup.add(leftWall);

        // Правая стена
        const rightWall = new T.Mesh(
            new T.BoxGeometry(wallThickness, h, d),
            wallMat
        );
        rightWall.position.set(w / 2, h / 2, 0);
        roomGroup.add(rightWall);

        roomGroup.position.set(worldX, 0, worldZ);
        scene.add(roomGroup);
        this.rooms.push(roomGroup);

        // Коллизии - простые AABB в мировых координатах
        const hw = w / 2;
        const hd = d / 2;
        const hh = h / 2;
        const wt = wallThickness / 2;

        // Передняя стена
        this.wallColliders.push({
            minX: worldX - hw, maxX: worldX + hw,
            minZ: worldZ - hd - wt, maxZ: worldZ - hd + wt,
            minY: 0, maxY: h
        });
        // Задняя стена
        this.wallColliders.push({
            minX: worldX - hw, maxX: worldX + hw,
            minZ: worldZ + hd - wt, maxZ: worldZ + hd + wt,
            minY: 0, maxY: h
        });
        // Левая стена
        this.wallColliders.push({
            minX: worldX - hw - wt, maxX: worldX - hw + wt,
            minZ: worldZ - hd, maxZ: worldZ + hd,
            minY: 0, maxY: h
        });
        // Правая стена
        this.wallColliders.push({
            minX: worldX + hw - wt, maxX: worldX + hw + wt,
            minZ: worldZ - hd, maxZ: worldZ + hd,
            minY: 0, maxY: h
        });

        // Добавляем объекты в комнату в зависимости от типа
        this.addRoomProps(roomGroup, roomType, w, h, d);

        return roomGroup;
    }

    // Добавление объектов в комнату
    addRoomProps(roomGroup, roomType, w, h, d) {
        const T = this.THREE;

        if (roomType === 1) {
            // Комната с колоннами
            const pillarGeo = new T.BoxGeometry(0.5, h, 0.5);
            const pillarMat = new T.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
            
            const positions = [
                [-w/3, h/2, -d/3],
                [w/3, h/2, -d/3],
                [-w/3, h/2, d/3],
                [w/3, h/2, d/3]
            ];

            positions.forEach(pos => {
                const pillar = new T.Mesh(pillarGeo, pillarMat);
                pillar.position.set(...pos);
                roomGroup.add(pillar);

                // Коллизия для колонны
                this.wallColliders.push({
                    minX: pos[0] - 0.3, maxX: pos[0] + 0.3,
                    minZ: pos[2] - 0.3, maxZ: pos[2] + 0.3,
                    minY: 0, maxY: h
                });
            });
        } else if (roomType === 2) {
            // Комната с ящиками
            const boxGeo = new T.BoxGeometry(1, 1, 1);
            const boxMat = new T.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });
            
            const positions = [
                [-w/4, 0.5, -d/4],
                [w/4, 0.5, -d/4],
                [-w/4, 0.5, d/4]
            ];

            positions.forEach(pos => {
                const box = new T.Mesh(boxGeo, boxMat);
                box.position.set(...pos);
                roomGroup.add(box);

                this.wallColliders.push({
                    minX: pos[0] - 0.5, maxX: pos[0] + 0.5,
                    minZ: pos[2] - 0.5, maxZ: pos[2] + 0.5,
                    minY: 0, maxY: 1
                });
            });
        } else if (roomType === 3) {
            // Пустая комната с лампой посередине
        }

        // Лампа на потолке
        if (Math.random() > 0.3) {
            const lightGeo = new T.BoxGeometry(0.3, 0.1, 0.3);
            const lightMat = new T.MeshBasicMaterial({ color: 0xffaa00 });
            const light = new T.Mesh(lightGeo, lightMat);
            const lx = (Math.random() - 0.5) * w * 0.5;
            const lz = (Math.random() - 0.5) * d * 0.5;
            light.position.set(lx, h - 0.1, lz);
            roomGroup.add(light);

            const pointLight = new T.PointLight(0xffaa00, 1, 12);
            pointLight.position.copy(light.position);
            roomGroup.add(pointLight);
        }
    }

    // Создание коридора
    createCorridor(materials, x1, z1, x2, z2, scene) {
        const T = this.THREE;
        const corridorGroup = new T.Group();
        const h = this.config.roomHeight;
        const wallThickness = 0.3;
        const corridorW = this.config.corridorWidth;
        const corridorD = this.config.roomWidth;
        const worldX = ((x1 + x2) / 2) * this.config.roomWidth;
        const worldZ = ((z1 + z2) / 2) * this.config.roomDepth;

        // Пол
        const floor = new T.Mesh(
            new T.PlaneGeometry(corridorW, corridorD),
            materials.carpet
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        corridorGroup.add(floor);

        // Потолок
        const ceiling = new T.Mesh(
            new T.PlaneGeometry(corridorW, corridorD),
            materials.ceiling
        );
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = h;
        corridorGroup.add(ceiling);

        // Стены коридора
        const sideWall1 = new T.Mesh(
            new T.BoxGeometry(wallThickness, h, corridorD),
            materials.wallpaper
        );
        sideWall1.position.set(-corridorW / 2, h / 2, 0);
        corridorGroup.add(sideWall1);

        const sideWall2 = new T.Mesh(
            new T.BoxGeometry(wallThickness, h, corridorD),
            materials.wallpaper
        );
        sideWall2.position.set(corridorW / 2, h / 2, 0);
        corridorGroup.add(sideWall2);

        corridorGroup.position.set(worldX, 0, worldZ);

        if (x1 === x2) {
            corridorGroup.rotation.y = Math.PI / 2;
        }

        scene.add(corridorGroup);

        // Коллизии для коридора
        const cw = corridorW / 2;
        const cd = corridorD / 2;
        const wt = wallThickness / 2;

        this.wallColliders.push({
            minX: worldX - cw - wt, maxX: worldX - cw + wt,
            minZ: worldZ - cd, maxZ: worldZ + cd,
            minY: 0, maxY: h
        });
        this.wallColliders.push({
            minX: worldX + cw - wt, maxX: worldX + cw + wt,
            minZ: worldZ - cd, maxZ: worldZ + cd,
            minY: 0, maxY: h
        });

        // Лампа в коридоре
        if (Math.random() > 0.5) {
            const lightGeo = new T.BoxGeometry(0.2, 0.05, 0.2);
            const lightMat = new T.MeshBasicMaterial({ color: 0xffaa00 });
            const light = new T.Mesh(lightGeo, lightMat);
            light.position.set(0, h - 0.1, 0);
            corridorGroup.add(light);

            const pointLight = new T.PointLight(0xffaa00, 0.8, 10);
            pointLight.position.copy(light.position);
            corridorGroup.add(pointLight);
        }
    }

    generateLevel(materials, scene) {
        const gridSize = this.config.gridSize;
        const center = Math.floor(gridSize / 2);

        this.rooms = [];
        this.wallColliders = [];
        this.generateMaze(gridSize);

        // Создаём комнаты с разными типами
        for (let x = 0; x < gridSize; x++) {
            for (let z = 0; z < gridSize; z++) {
                if (this.grid[x][z] === 1) {
                    const roomType = Math.floor(Math.random() * 4); // 0-3 разные типы
                    this.createRoom(materials, x - center, z - center, scene, roomType);
                }
            }
        }

        // Создаём коридоры
        for (let x = 0; x < gridSize; x++) {
            for (let z = 0; z < gridSize; z++) {
                if (this.grid[x][z] === 1) {
                    if (x + 1 < gridSize && this.grid[x + 1][z] === 1) {
                        this.createCorridor(materials, x, z, x + 1, z, scene);
                    }
                    if (z + 1 < gridSize && this.grid[x][z + 1] === 1) {
                        this.createCorridor(materials, x, z, x, z + 1, scene);
                    }
                }
            }
        }

        return this.rooms;
    }

    // Получить коллизии
    getWallColliders() {
        return this.wallColliders;
    }
}
