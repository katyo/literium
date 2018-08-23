declare module 'sodium-native' {
    const crypto_box_PUBLICKEYBYTES: number;
    const crypto_box_SECRETKEYBYTES: number;
    const crypto_box_SEEDBYTES: number;

    function crypto_box_seed_keypair(publicKey: Buffer, secretKey: Buffer, seed: Buffer): void;
    function crypto_box_keypair(publicKey: Buffer, secretKey: Buffer): void;

    const crypto_box_SEALBYTES: number;

    function crypto_box_seal(cipher: Buffer, message: Buffer, publicKey: Buffer): void;
    function crypto_box_seal_open(message: Buffer, cipher: Buffer, publicKey: Buffer, secretKey: Buffer): boolean;

    function sodium_memzero(buffer: Buffer): void;
}
