// ...existing code...
setupGameCamera() {
    // Aquí es donde se configura la cámara principal
    this.camera = this.cameras.main;
    this.camera.zoom = 0.8;
    if (this.player) {
        this.camera.startFollow(this.player.hull);
    }
}
// ...existing code...
