#include <stdio.h>
#include <zs4.h>
#include <zs4util.h>

#define P(n) printf("%s: %d\n",#n,(int)n())

int main(int argc, char **argv)
{

	util::in in;
	util::out out;

	zs4::quad::bytestream quadin((zs4::byte::stream*)&in);
	zs4::quad::bytestream quadout((zs4::byte::stream*)&out);
	
	unsigned char buffer[255];
	zs4::byte::object object(NULL,buffer,255, &in, &out);
	
	for (;;){
		if (SUCCESS != object.tickle())
		{
			printf("press ctrl c to quit\n");
		}
	}

	DBG_GETCHAR;

	return 0;
}
