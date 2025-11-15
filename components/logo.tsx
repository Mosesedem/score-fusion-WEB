import Image from "next/image";

function Logo() {
  return (
    <div className="flex items-center">
      <Image
        src="/images/1.png"
        alt="Logo"
        width={80}
        height={40}
        className="mr-2"
      />
    </div>
  );
}

function Icon() {
  return (
    <div className="flex items-center">
      <Image
        src="/images/2.png"
        alt="Icon"
        width={60}
        height={60}
        className="mr-2"
      />
    </div>
  );
}

export { Logo, Icon };
