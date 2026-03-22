/**
 * The Backrooms - Procedural Level Generator
 * Алгоритм генерации лабиринта с использованием DFS (Depth-First Search)
 */

export class LevelGenerator {
    constructor(config, THREE) {
        this.config = config;
        this.THREE = THREE;
        this.grid = [];
        this.rooms = [];
    }

    // Инициализация сетки
    initGrid(size) {
        this.grid = [];
        for (let x = 0; x < size; x++) {
            this.grid[x] = [];
            for (let z = 0; z < size; z++) {
                this.grid[x][z] = 0;
            }
        }
    }

    // Проверка валидности координат
    isValid(x, z, size) {
        return x >= 0 && z >= 0 && x < size && z < size;
    }

    // Получение непосещённых соседей
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
                neighbors.push({
                    x: nx,
                    z: nz,
                    dx: dir.dx / 2,
                    dz: dir.dz / 2
                });
            }
        }
        return neighbors;
    }

    // Генерация лабиринта алгоритмом DFS
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

        // Добавляем случайные комнаты для разнообразия
        this.addRandomRooms(size);
    }

    // Добавление случайных комнат
    addRandomRooms(size) {
        for (let x = 0; x < size; x++) {
            for (let z = 0; z < size; z++) {
                if (this.grid[x][z] === 0 && Math.random() < 0.15) {
                    const hasNeighbor =
                        (this.isValid(x - 1, z, size) && this.grid[x - 1][z] === 1) ||
                        (this.isValid(x + 1, z, size) && this.grid[x + 1][z] === 1) ||
                        (this.isValid(x, z - 1, size) && this.grid[x][z - 1] === 1) ||
                        (this.isValid(x, z + 1, size) && this.grid[x][z + 1] === 1);
                    if (hasNeighbor) {
                        this.grid[x][z] = 1;
                    }
                }
            }
        }
    }

    // Создание комнаты Three.js
    createRoom(materials, x, z, scene) {
        const T = this.THREE;
        const roomGroup = new T.Group();
        const w = this.config.roomWidth;
        const h = this.config.roomHeight;
        const d = this.config.roomDepth;
        const wallThickness = 0.2;

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

        // Стены
        const frontWall = new T.Mesh(
            new T.BoxGeometry(w, h, wallThickness),
            materials.wallpaper
        );
        frontWall.position.set(0, h / 2, -d / 2);
        roomGroup.add(frontWall);

        const backWall = new T.Mesh(
            new T.BoxGeometry(w, h, wallThickness),
            materials.wallpaper
        );
        backWall.position.set(0, h / 2, d / 2);
        roomGroup.add(backWall);

        const leftWall = new T.Mesh(
            new T.BoxGeometry(wallThickness, h, d),
            materials.wallpaper
        );
        leftWall.position.set(-w / 2, h / 2, 0);
        roomGroup.add(leftWall);

        const rightWall = new T.Mesh(
            new T.BoxGeometry(wallThickness, h, d),
            materials.wallpaper
        );
        rightWall.position.set(w / 2, h / 2, 0);
        roomGroup.add(rightWall);

        roomGroup.position.set(x * w, 0, z * d);
        scene.add(roomGroup);
        this.rooms.push(roomGroup);

        return roomGroup;
    }

    // Создание коридора
    createCorridor(materials, x1, z1, x2, z2, scene) {
        const T = this.THREE;
        const corridorGroup = new T.Group();
        const h = this.config.roomHeight;
        const wallThickness = 0.2;
        const corridorW = this.config.corridorWidth;
        const corridorD = this.config.roomWidth;

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

        // Стены
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

        // Позиция
        const midX = ((x1 + x2) / 2) * this.config.roomWidth;
        const midZ = ((z1 + z2) / 2) * this.config.roomDepth;
        corridorGroup.position.set(midX, 0, midZ);

        if (x1 === x2) {
            corridorGroup.rotation.y = Math.PI / 2;
        }

        scene.add(corridorGroup);

        // Лампа
        if (Math.random() > 0.5) {
            this.addLight(corridorGroup, h, 0.8, 12);
        }
    }

    // Добавление света
    addLight(parent, height, intensity = 1, distance = 15) {
        const T = this.THREE;
        const lightGeometry = new T.BoxGeometry(0.3, 0.1, 0.3);
        const lightMaterial = new T.MeshBasicMaterial({ color: 0xffaa00 });
        const light = new T.Mesh(lightGeometry, lightMaterial);
        light.position.set(0, height - 0.1, 0);
        parent.add(light);

        const pointLight = new T.PointLight(0xffaa00, intensity, distance);
        pointLight.position.copy(light.position);
        parent.add(pointLight);
    }

    // Добавление ламп в комнату
    addRoomLights(room) {
        const T = this.THREE;
        if (Math.random() > 0.25) {
            const offsetX = (Math.random() - 0.5) * this.config.roomWidth * 0.6;
            const offsetZ = (Math.random() - 0.5) * this.config.roomDepth * 0.6;
            const lightGeometry = new T.BoxGeometry(0.3, 0.1, 0.3);
            const lightMaterial = new T.MeshBasicMaterial({ color: 0xffaa00 });
            const light = new T.Mesh(lightGeometry, lightMaterial);
            light.position.set(offsetX, this.config.roomHeight - 0.1, offsetZ);
            room.add(light);

            const pointLight = new T.PointLight(0xffaa00, 1, 15);
            pointLight.position.copy(light.position);
            room.add(pointLight);
        }
    }

    // Основная функция генерации уровня
    generateLevel(materials, scene) {
        const gridSize = this.config.gridSize;
        const center = Math.floor(gridSize / 2);

        this.rooms = [];
        this.generateMaze(gridSize);

        // Создаём комнаты
        for (let x = 0; x < gridSize; x++) {
            for (let z = 0; z < gridSize; z++) {
                if (this.grid[x][z] === 1) {
                    this.createRoom(materials, x - center, z - center, scene);
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

        // Добавляем лампы
        this.rooms.forEach(room => this.addRoomLights(room));

        return this.rooms;
    }

    // Получить сетку (для отладки)
    getGrid() {
        return this.grid;
    }
}
