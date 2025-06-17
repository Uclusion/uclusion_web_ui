import sys


def main(url, file):
    print(url)
    print(file)


if __name__ == "__main__":
    url = sys.argv[1]
    file = sys.argv[2]
    main(url, file)