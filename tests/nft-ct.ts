import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { NftCt } from "../target/types/nft_ct";
import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { MPL_TOKEN_METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import BN from "bn.js";

describe("nft-ct", () => {
  // Set up the provider to interact with the local network
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.NftCt as Program<NftCt>;

  it("Mints an NFT", async () => {
    // Metadata for the NFT
    const id = new BN(2);
    const name = "Cat NFT";
    const symbol = "EMB";
    const uri = "https://gateway.irys.xyz/7Ce5hD2HdMzkSNJCp5u5Xe1y27qjZSWsyGjia3J7Gisd";

    const provider = program.provider as anchor.AnchorProvider;
    const payer = provider.wallet as anchor.Wallet;

    // Create the mint address
    const [mint, mintBump] = await PublicKey.findProgramAddress(
      [
        Buffer.from("mint"),               // First seed: "mint"
        id.toArrayLike(Buffer, "le", 8)    // Second seed: id.to_le_bytes() (little-endian 8 bytes)
      ],
      program.programId                    // Program ID
    );

    // Get the associated token account address for the payer
    const tokenAccount = await getAssociatedTokenAddress(
      mint,
      payer.publicKey, 
    );

    const [metadataPDA] = await PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID).toBuffer(),
        mint.toBuffer(),
      ],
      new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID)
    );

    const [masterEditionPDA] = await PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID).toBuffer(),
        mint.toBuffer(),
        Buffer.from("edition"),
      ],
      new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID)
    );

    console.log(
      "Mint:", mint.toBase58(),
      "Metadata:", metadataPDA.toBase58(),
      "MasterEdition:", masterEditionPDA.toBase58(),
      "TokenAccount:", tokenAccount.toBase58(),
      "payer:", payer.publicKey.toBase58(),
      "MetadataProgram:", new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID).toBase58()
    );

    // Call the mint function from the program
    const tx = await program.methods
      .createSingleNft(id, name, symbol, uri)
      .accounts({
        authority: payer.publicKey,
        payer: payer.publicKey,
        mint: mint,
        tokenAccount: tokenAccount,
        nftMetadata: metadataPDA,
        masterEditionAccount: masterEditionPDA,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        metadataProgram: new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID),
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("\nYour transaction signature:", tx);

    // Add assertions to check if the accounts were created as expected.
    // This might involve checking for balances or fetching the account data.
    const mintedAccount = await program.provider.connection.getParsedAccountInfo(mint);
    assert.ok(mintedAccount.value !== null, "Mint account should exist after minting.");
  });
});

//mint address for the following metadata: 
  // const id = new BN(1);
  // const name = "Cat NFT";
  // const symbol = "EMB";
  // const uri = "https://gateway.irys.xyz/7Ce5hD2HdMzkSNJCp5u5Xe1y27qjZSWsyGjia3J7Gisd";
//: DN3gd713NXBcpnHc9Zxc4dHg6GjaKhLjCEo6wF2kmZWc
//transaction signature: 426HVBojxHgobTsoCw4Vqe2yeMyXUMW34dx9ksoMaVcLjJhkghodcjxnqnQi4R5tmYLoy7Y4FXeqHcPGvr67Rkgf

//mint address for the following metadata: 
  // const id = new BN(2);
  // const name = "Cat NFT";
  // const symbol = "EMB";
  // const uri = "https://gateway.irys.xyz/7Ce5hD2HdMzkSNJCp5u5Xe1y27qjZSWsyGjia3J7Gisd";
//: EEWdUCvXPQxK1iW2S6ViqRjyhZ5mQVmQwEGo9JsvZ4S5
//transaction signature: ByzrdZHM939r1x8UAT9xjxKE2ifpVWWL5vAFwkyXnp21ZRh1RRe3Jh5hL1bmDNgqH7k8VuKf84oszoKNsekmvuM
